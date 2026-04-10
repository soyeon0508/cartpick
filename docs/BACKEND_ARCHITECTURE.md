# CartPick 백엔드 아키텍처

## 1. 기술 스택

| 영역 | 선택 | 이유 |
|------|------|------|
| **Mobile App** | Flutter | 크로스플랫폼 단일 코드베이스, UI 표현력 |
| **API Server** | NestJS | 모듈화 구조, TypeScript 일관성, DI 표준 |
| **Database** | PostgreSQL | 전문 검색 (pg_trgm), JSONB, 안정성 |
| **ORM** | Prisma | 타입 안전, 마이그레이션 관리, 가독성 |
| **Auth** | JWT + OAuth2 (카카오, 애플) | 모바일 소셜 로그인 표준 |
| **Admin Web** | Next.js (App Router) | 모노레포 TS 통합, 테이블 친화적 |
| **Storage** | AWS S3 + CloudFront | 이미지 저장 + CDN |
| **Deployment** | Railway (MVP) → AWS ECS (Scale) | 초기 운영 부담 최소화 |

---

## 2. NestJS 모듈 구조

```
apps/api/src/
├── main.ts
├── app.module.ts
│
├── modules/
│   ├── auth/                 # 소셜 로그인, JWT, guards
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── kakao.strategy.ts
│   │   │   └── apple.strategy.ts
│   │   └── guards/
│   │       ├── jwt-auth.guard.ts
│   │       ├── optional-auth.guard.ts
│   │       └── admin.guard.ts
│   │
│   ├── countries/
│   ├── retailers/
│   ├── categories/
│   ├── brands/
│   │
│   ├── products/             # 핵심 도메인
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   ├── products.repository.ts
│   │   └── dto/
│   │
│   ├── reviews/              # 핵심 도메인
│   │   ├── reviews.controller.ts
│   │   ├── reviews.service.ts
│   │   ├── reviews.repository.ts
│   │   ├── review-stats.service.ts  # aggregate 갱신
│   │   └── dto/
│   │
│   ├── bookmarks/
│   ├── reports/              # 리뷰 신고
│   ├── notifications/
│   ├── badges/               # 뱃지 부여 로직
│   │
│   ├── home/                 # 편집 홈
│   │   ├── home.controller.ts
│   │   ├── home.service.ts
│   │   └── resolvers/        # 섹션 타입별 쿼리
│   │       ├── new-this-week.resolver.ts
│   │       ├── trending.resolver.ts
│   │       ├── popular-by-retailer.resolver.ts
│   │       └── on-sale.resolver.ts
│   │
│   ├── search/
│   ├── analytics/            # 이벤트 수집
│   │
│   └── admin/                # 관리자 API
│       ├── admin.module.ts
│       ├── products/
│       ├── retailer-products/
│       ├── reviews/
│       ├── home-sections/
│       ├── merge/
│       └── dashboard/
│
├── common/                   # 공용
│   ├── decorators/
│   ├── filters/              # ExceptionFilter
│   ├── interceptors/         # LoggingInterceptor
│   ├── pipes/                # ValidationPipe
│   └── utils/
│
├── prisma/                   # PrismaService wrapper
│   └── prisma.service.ts
│
└── config/                   # 환경설정
    ├── app.config.ts
    ├── database.config.ts
    └── auth.config.ts
```

### 모듈 설계 원칙

- 도메인당 1 모듈
- 관리자 API는 `modules/admin/` 하위에 별도 배치
- 모든 public API는 `/api/v1/**`, 관리자 API는 `/api/admin/v1/**`

---

## 3. 서비스 계층 패턴

**Controller → Service → Repository** 3계층 구조.

### 역할 분리

| 계층 | 책임 |
|------|------|
| **Controller** | HTTP 입출력, DTO 검증, 가드 적용. 비즈니스 로직 금지 |
| **Service** | 비즈니스 로직, 트랜잭션, 여러 Repository 조합 |
| **Repository** | Prisma 쿼리. DB 접근의 유일한 경로 |

### 예시: Products 모듈

```typescript
// products.controller.ts
@Controller('products')
export class ProductsController {
  @Get(':id')
  @UseGuards(OptionalAuthGuard)
  async getDetail(
    @Param('id') id: number,
    @CurrentUser() viewer: User | null,
  ) {
    return this.productsService.getDetail(id, viewer?.id);
  }
}

// products.service.ts
@Injectable()
export class ProductsService {
  async getDetail(productId: number, viewerId?: number) {
    const product = await this.productsRepo.findByIdWithRelations(productId);
    if (!product) throw new NotFoundException();

    const retailers = await this.retailerProductsRepo.listByProduct(productId);
    const myReview = viewerId
      ? await this.reviewsRepo.findByUserAndProduct(viewerId, productId)
      : null;

    return this.assembleProductDetail(product, retailers, myReview);
  }
}

// products.repository.ts
@Injectable()
export class ProductsRepository {
  constructor(private prisma: PrismaService) {}

  findByIdWithRelations(id: number) {
    return this.prisma.product.findUnique({
      where: { id },
      include: { brand: true, category: true },
    });
  }
}
```

---

## 4. API → DB 실제 흐름

### A. 리테일러별 상품 목록

`GET /api/v1/retailers/:retailerId/products`

```
1. retailer_products에서 retailer_id로 필터
2. is_available = true
3. category_id 추가 필터 (선택)
4. products JOIN
5. brands JOIN
6. 정렬 (popular / newest / rating)
7. cursor pagination
```

**쿼리 대상:** `retailer_products` → `products` → `brands`

**인덱스:** `idx_retailer_products_retailer(retailer_id, is_available)`

---

### B. 상품 상세

`GET /api/v1/products/:productId`

```
1. products 조회 + brands/categories join
2. retailer_products 리스트 조회 (판매처)
3. products.review_count / average_rating 바로 사용
4. rating_distribution 별도 aggregate 쿼리
5. tag_counts 별도 aggregate 쿼리 (review_tags)
6. repurchase_rate 별도 aggregate 쿼리
7. my_review 조회 (로그인 시)
8. 응답 조합
```

**성능 전략:**
- `review_count`, `average_rating` → 비정규화 캐시 (실시간)
- `rating_distribution`, `tag_counts` → 집계 쿼리 (나중에 materialized view 가능)

---

### C. 리뷰 목록

`GET /api/v1/products/:productId/reviews`

```
1. reviews에서 product_id 필터
2. moderation_status IN ('approved')  -- 또는 visible
3. retailer_id 필터 (선택)
4. 정렬 (newest / helpful / rating_high / rating_low)
5. users JOIN + user_badges JOIN
6. retailers JOIN
7. review_tags JOIN (또는 별도 쿼리)
8. is_liked_by_me 판단 (로그인 시)
9. cursor pagination
```

---

### D. 리뷰 작성 (트랜잭션 필수)

`POST /api/v1/products/:productId/reviews`

```
BEGIN TRANSACTION
  1. Auth user 확인
  2. Product 존재 확인
  3. (user_id, product_id) 중복 확인
  4. reviews INSERT
  5. review_tags BULK INSERT
  6. products aggregate 갱신
     - review_count += 1
     - average_rating 재계산
  7. 첫 리뷰 여부 확인 → user_badges INSERT (first_reviewer)
  8. analytics_events INSERT (review_submitted)
COMMIT

9. 응답 조립 (review + awarded_badges)
```

**핵심 원칙:**
- **리뷰 저장과 집계 갱신을 하나의 서비스 계층에서 트랜잭션으로 묶는다.**
- 뱃지 부여도 같은 트랜잭션 내에서 처리
- 알림 발송 등 외부 사이드 이펙트는 트랜잭션 밖에서 (이벤트 발행)

---

## 5. Aggregate 전략

### MVP: 애플리케이션 레벨 실시간 갱신

리뷰 생성/수정/삭제 시 즉시 `products` 캐시 필드 갱신:

```typescript
// reviews.service.ts
async create(dto: CreateReviewDto, userId: number, productId: number) {
  return this.prisma.$transaction(async (tx) => {
    const review = await tx.review.create({ ... });

    // aggregate 갱신
    const stats = await tx.review.aggregate({
      where: { productId, moderationStatus: 'approved' },
      _avg: { rating: true },
      _count: true,
    });

    await tx.product.update({
      where: { id: productId },
      data: {
        reviewCount: stats._count,
        averageRating: stats._avg.rating,
      },
    });

    // 첫 리뷰어 뱃지
    if (stats._count === 1) {
      await this.badgeService.award(tx, userId, 'first_reviewer', productId);
    }

    return review;
  });
}
```

### Post-MVP: 배치 / 이벤트 기반

- `review_stats` 별도 테이블 (시간대별 증가량 등)
- `retailer_product_stats`
- `category_trending_stats`
- 주기적 배치 또는 이벤트 기반 갱신

---

## 6. Prisma Schema 개요

```prisma
model Product {
  id                Int      @id @default(autoincrement())
  countryId         Int
  brandId           Int
  categoryId        Int
  name              String
  normalizedName    String
  summaryLine       String?
  description       String?
  imageUrl          String?
  barcode           String?
  volumeValue       Decimal?
  volumeUnit        String?
  packageType       String?
  status            String   @default("active")
  reviewCount       Int      @default(0)
  averageRating     Decimal?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  country           Country  @relation(fields: [countryId], references: [id])
  brand             Brand    @relation(fields: [brandId], references: [id])
  category          Category @relation(fields: [categoryId], references: [id])

  retailerProducts  RetailerProduct[]
  reviews           Review[]
  bookmarks         Bookmark[]
  aliases           ProductAlias[]

  @@index([categoryId, countryId, status])
  @@index([brandId, countryId])
  @@index([normalizedName])
}

model RetailerProduct {
  id                Int      @id @default(autoincrement())
  retailerId        Int
  productId         Int
  retailerProductName String?
  price             Int?
  salePrice         Int?
  isAvailable       Boolean  @default(true)
  isNew             Boolean  @default(false)
  lastSyncedAt      DateTime?

  retailer          Retailer @relation(fields: [retailerId], references: [id])
  product           Product  @relation(fields: [productId], references: [id])

  @@unique([retailerId, productId])
  @@index([retailerId, isAvailable])
}

model Review {
  id                Int      @id @default(autoincrement())
  userId            Int
  productId         Int
  retailerId        Int?
  rating            Int
  title             String?
  body              String   @default("")
  repurchaseIntent  Boolean  @default(false)
  moderationStatus  String   @default("approved")
  reportedCount     Int      @default(0)
  likeCount         Int      @default(0)
  adminNote         String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user              User     @relation(fields: [userId], references: [id])
  product           Product  @relation(fields: [productId], references: [id])
  retailer          Retailer? @relation(fields: [retailerId], references: [id])
  tags              ReviewTag[]
  likes             ReviewLike[]

  @@unique([userId, productId])
  @@index([productId, moderationStatus, createdAt(sort: Desc)])
}
```

전체 schema는 구현 시 [docs/erd/schema.sql](../erd/schema.sql)과 동기화.

---

## 7. 권한 구조 & Guards

### 권한 레벨

| 레벨 | 권한 |
|------|------|
| **public** | 국가, 리테일러, 카테고리, 상품, 리뷰 **읽기** |
| **user** | 리뷰 작성, 좋아요, 즐겨찾기, 신고, 알림 |
| **admin** | 상품 CRUD, 리테일러 연결, 리뷰 모더레이션, 홈 운영 |

### Guards

| Guard | 용도 |
|-------|------|
| `JwtAuthGuard` | 로그인 필수 엔드포인트 |
| `OptionalAuthGuard` | 비로그인/로그인 모두 허용 (리뷰 목록, 상품 상세) |
| `AdminGuard` | 관리자 전용 (`/api/admin/v1/**`) |

### 엔드포인트 구분

```
/api/v1/**         → Public API (JwtAuthGuard / OptionalAuthGuard)
/api/admin/v1/**   → Admin API (AdminGuard 필수)
```

---

## 8. API 응답 조립 원칙

> **모바일/웹 화면 단위로 응답을 만든다.**

### 원칙

- 상품 상세 API = 상품 상세 화면이 한 번에 그릴 수 있어야 함
- 홈 API = 섹션 단위로 바로 렌더링 가능해야 함
- 리뷰 목록 API = 카드 리스트에 필요한 모든 데이터 포함

### 하지 말 것

> **프론트가 1개 화면 그리려고 API 5개씩 부르게 만들기 금지**

N+1 문제가 생기면 Service 레벨에서 데이터를 미리 조합해서 반환.

---

## 9. 홈 API 실제 구조 (편집 홈)

`GET /api/v1/countries/:countryCode/home`

### 처리 흐름

```
1. home_sections 조회 (is_active = true, 정렬)
2. 각 섹션별로 resolver 호출
   - new_this_week → NewThisWeekResolver
   - trending → TrendingResolver
   - popular_by_retailer → PopularByRetailerResolver (auto_config.retailer_slug)
   - on_sale → OnSaleResolver
   - manual → home_section_items 조회
   - categories → 카테고리 리스트
3. resolver가 auto_config 기반으로 쿼리 실행
4. 각 섹션 결과 조합 → 응답
```

### Resolver 패턴

```typescript
// home.service.ts
async getHome(countryCode: string) {
  const sections = await this.sectionsRepo.listActive(countryCode);

  const resolved = await Promise.all(
    sections.map((section) =>
      this.resolverRegistry.resolve(section),
    ),
  );

  return { sections: resolved };
}

// home/resolvers/resolver-registry.ts
@Injectable()
export class ResolverRegistry {
  constructor(
    private newThisWeek: NewThisWeekResolver,
    private trending: TrendingResolver,
    private popularByRetailer: PopularByRetailerResolver,
    // ...
  ) {}

  resolve(section: HomeSection) {
    switch (section.sectionType) {
      case 'new_this_week': return this.newThisWeek.resolve(section);
      case 'trending': return this.trending.resolve(section);
      case 'popular_by_retailer': return this.popularByRetailer.resolve(section);
      // ...
    }
  }
}
```

**장점:**
- 섹션 타입 추가 = Resolver 추가만 하면 됨
- `home_sections.auto_config` (JSONB)로 조건 유연하게 관리
- 관리자가 홈 편집해도 API 코드 수정 불필요

---

## 10. 검색 전략

### MVP: PostgreSQL pg_trgm

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_products_name_trgm ON products
  USING gin (normalized_name gin_trgm_ops);

CREATE INDEX idx_brands_name_trgm ON brands
  USING gin (name gin_trgm_ops);

CREATE INDEX idx_product_aliases_trgm ON product_aliases
  USING gin (alias_name gin_trgm_ops);
```

### 검색 우선순위

1. `products.normalized_name` (LIKE + trigram)
2. `brands.name`
3. `product_aliases.alias_name`

### 쿼리 예시

```sql
SELECT p.*
FROM products p
LEFT JOIN product_aliases pa ON pa.product_id = p.id
WHERE p.country_id = $1
  AND p.status = 'active'
  AND (
    p.normalized_name ILIKE '%' || $2 || '%'
    OR similarity(p.normalized_name, $2) > 0.3
    OR pa.alias_name ILIKE '%' || $2 || '%'
  )
ORDER BY similarity(p.normalized_name, $2) DESC, p.review_count DESC
LIMIT 20;
```

### 이유

> 초기엔 Elasticsearch 필요 없다. pg_trgm만으로 한글 부분 매칭 충분.

### Post-MVP

- Meilisearch 또는 Elasticsearch 도입 (한글 형태소 분석)
- 랭킹 가중치 튜닝 (최근 리뷰 수, 평점 등)

---

## 11. 관리자 API 분리

### URL 구조

```
# Public
/api/v1/products/:id
/api/v1/reviews

# Admin
/api/admin/v1/products
/api/admin/v1/reviews
/api/admin/v1/home-sections
```

### 모듈 분리

```
apps/api/src/modules/
├── products/                    # Public
│   └── products.controller.ts   → @Controller('products')
│
└── admin/
    └── products/
        └── admin-products.controller.ts → @Controller('admin/v1/products')
```

### 이유

- 권한 경계 명확
- Public API 스펙 안정성 (외부 노출 대비)
- 어드민 고도화 시 독립 배포 가능

---

## 12. 시작 순서 (4주 로드맵)

### 🔥 Week 1: 뼈대 구축

- [ ] NestJS bootstrap (`apps/api`)
- [ ] PrismaService, PostgreSQL 연결
- [ ] Prisma schema 정의 (전체 테이블)
- [ ] 초기 migration
- [ ] Auth skeleton (JwtAuthGuard, OptionalAuthGuard, AdminGuard)
- [ ] 소셜 로그인 (카카오 먼저)
- [ ] 관리자 로그인 (이메일/비번)
- [ ] Seed 스크립트 구조 (countries, retailers, categories, badge_types)

### 🔥 Week 2: Public Read/Write API

- [ ] Countries / Retailers / Categories read API
- [ ] Brands read API
- [ ] Products search + list + detail API
- [ ] Retailer products list API
- [ ] Reviews read API (필터/정렬)
- [ ] Reviews write API (트랜잭션 + 뱃지 부여)
- [ ] Analytics events 수집 API

### 🔥 Week 3: 유저/관리자 기능

- [ ] Bookmarks
- [ ] Reports (리뷰 신고)
- [ ] Notifications 기본
- [ ] Admin: product CRUD
- [ ] Admin: retailer-product CRUD
- [ ] Admin: review moderation
- [ ] Admin: dashboard stats API

### 🔥 Week 4: 홈/검색/마무리

- [ ] Home sections + resolver 패턴
- [ ] Admin: home section CRUD
- [ ] 검색 API (pg_trgm)
- [ ] Aggregate cache 보정 스크립트
- [ ] Swagger 문서 정리
- [ ] 시드 데이터 import (상품 200~300개)
- [ ] E2E 스모크 테스트

---

## 13. 운영 역할 구조 (참고)

초기엔 1인이 전부 담당하지만, 시스템은 다음 역할로 쪼개서 설계:

| 역할 | 담당 |
|------|------|
| **Catalog Ops** | 상품 등록, 브랜드/카테고리 관리, 병합 |
| **Community Ops** | 리뷰 모더레이션, 신고 처리, 유저 관리 |
| **Merchandising Ops** | 홈 편집, 섹션 운영, 프로모션 |
| **Data Ops** | 가격 업데이트, aggregate 보정, 분석 |

이 역할 경계가 관리자 API 권한 설계의 근거가 된다 (Post-MVP 세분화 시).
