# 마트/편의점 상품 리뷰 앱 - PRD 초안

## A. 서비스 한 줄 정의

> **"사기 전에 먹어본 사람한테 물어보자"** — 마트·편의점 상품의 실구매 리뷰를 한곳에서 확인하고, 내 경험도 공유할 수 있는 상품 리뷰 플랫폼

---

## B. 핵심 사용자 시나리오

### 타겟 유저

| 유저 유형 | 설명 |
|-----------|------|
| **탐색형 소비자** | 편의점 신상품이 나오면 "이거 맛있어?" 궁금한 사람 |
| **리뷰 작성자** | 새로운 상품 먹어보고 후기 남기는 걸 즐기는 사람 |
| **알뜰 소비자** | 같은 상품이 어디가 더 싼지, 행사 중인지 궁금한 사람 |
| **해외 소비자 (장기)** | 한국 편의점 상품이 궁금한 외국인, 해외 마트 유저 |

### 핵심 시나리오

**시나리오 1: 신상품 리뷰 확인**
```
유저가 GS25에서 새로 나온 젤리를 발견
→ 앱에서 GS25 → 젤리 카테고리 진입
→ 해당 상품 탭
→ 별점 3.8, 리뷰 12개 확인
→ "맛은 좋은데 양이 적다"는 의견 다수
→ 구매 결정
```

**시나리오 2: 리뷰 작성**
```
유저가 CU에서 새 라면을 먹어봄
→ 앱에서 해당 상품 검색
→ "CU에서 구매" 선택 후 리뷰 작성
→ 별점 4점, 맛 5/가성비 3/양 4
→ "매운맛인데 국물이 진하다" 한줄평
→ 재구매 의사: O
```

**시나리오 3: 크로스 리테일러 비교**
```
유저가 하리보 골드베렌이 궁금
→ 검색으로 상품 진입
→ 통합 리뷰 47개 확인
→ "GS25에서 구매한 리뷰만 보기" 필터
→ GS25 가격 2,500원 / CU 가격 2,800원 확인
```

**시나리오 4: 마트별 탐색**
```
유저가 한국 선택 → 홈 화면
→ GS25 탭 진입
→ "이번 주 신상" / "인기 상품" 섹션
→ 카테고리별 브라우징
→ 관심 상품 즐겨찾기
```

---

## C. MVP 범위 제안

> 📌 GTM 전략과 함께 보세요: [GTM_STRATEGY.md](./GTM_STRATEGY.md)
>
> MVP 범위는 **"편의점 신상품 → 궁금 → 검색 → 리뷰 없음 → 내가 첫 리뷰 작성"** 루프를 성립시키는 데 필요한 최소 집합으로 설계되었다. GTM 전략에서 파생된 기능은 표의 "GTM" 열에 표시.

### 반드시 필요한 것 (Must Have)

| 기능 | 설명 | GTM |
|------|------|-----|
| 국가 선택 | MVP에서는 한국만 활성화, UI상 구조는 다국가 대응 | - |
| 리테일러 목록 | GS25, CU, 세븐일레븐, 이마트24 (활성) + Costco, 트레이더스 (coming soon) | - |
| 카테고리 탐색 | 과자, 젤리, 음료, 라면, 아이스크림, 간편식 | - |
| 리테일러별 상품 목록 | 리테일러 진입 → 카테고리별 상품 리스트 | - |
| 상품 상세 | 이름, 브랜드, 이미지, 판매 리테일러 목록, 가격 참고 | - |
| **상품 상세: 한 줄 요약** | 상품 헤더 하단 `summary_line` 노출 (관리자 입력) | Conversion |
| **상품 상세: 상단 CTA** | 헤더 바로 아래 "리뷰 쓰기" 버튼 (즉시 작성 진입) | Conversion |
| **상품 상세: 하단 고정 CTA** | 스크롤 무관 항상 노출되는 Sticky 리뷰 작성 버튼 | Conversion |
| **상품 상세: 리뷰 요약 키워드** | 태그 집계 기반 "많이 언급된 키워드" 섹션 | Conversion |
| **상품 상세: 구매처별 리뷰 필터** | 리테일러 카드 탭 → 해당 구매처 리뷰만 보기 | - |
| **상품 상세: 케이스별 리뷰 전환 UI** | 리뷰 0개 / 1~3개 / 4+개 각각 다른 유도 UI | Activation |
| 통합 리뷰 목록 | 상품 기준 리뷰 통합, 리테일러별 필터 | - |
| 리뷰 작성/수정 | 한 상품당 1리뷰, 수정 가능 | - |
| **단일 화면 리뷰 작성 폼** | 별점 → 태그 → 구매처 → 한줄평 순서, 한 화면에서 완료 | Activation |
| **별점 자동 확장 UX** | 별점 선택 시 태그 영역 슬라이드 자동 노출 | Activation |
| **별점별 감정 메시지** | "무난했나요?", "정말 맛있었나요?" 등 동적 메시지 | Activation |
| **리뷰 작성 후 로그인** | 폼 작성 완료 → 제출 시점에 로그인 (작성 전 로그인 강제 금지) | Activation |
| **리뷰 제출 완료 보상 화면** | 🎉 완료 메시지 + 뱃지 획득 애니메이션 | Activation |
| **플레이스홀더 예시 텍스트** | 한 줄평 입력창에 예시 문장 (빈칸 공포 제거) | Activation |
| **첫 리뷰 유도 UX** | 리뷰 0개 상품에 "첫 리뷰어가 되어보세요" 배너 + 뱃지 유도 | Activation |
| **첫 리뷰어 뱃지** | 상품의 첫 리뷰 작성자에게 "First Reviewer" 뱃지 지급 | Activation |
| **검색 → 리뷰 작성 경로 최적화** | 검색 → 상품 상세 → 리뷰 작성까지 3탭 이내 | KPI 3 |
| **홈 화면: 신상 섹션** | "🔥 이번 주 편의점 신상" 가로 스크롤 섹션 | Discovery |
| **홈 화면: 마트별 인기 섹션** | "🏪 GS25 인기", "🏪 CU 인기" 섹션 (차별 포인트) | Discovery |
| **홈 화면: 카테고리 그리드** | "🎯 카테고리" 아이콘 그리드 | Discovery |
| **상품 카드 상태 뱃지** | NEW / HOT / 첫 리뷰 / SALE / 호불호 통일 표시 | Activation |
| 회원가입/로그인 | 소셜 로그인 (카카오, 애플) | - |
| 상품 검색 | 이름/브랜드 기반 텍스트 검색 | KPI 3 |
| **리뷰 작성 깔때기 트래킹** | 상품 노출 → 상세 진입 → 리뷰 작성 이벤트 로깅 | KPI 측정 |
| 관리자: 상품 등록 | 상품/브랜드/카테고리 CRUD | Seed |
| **관리자: Seed 리뷰 입력** | 팀이 초기 리뷰 300~500개 등록 가능한 플로우 | Seed |

### 있으면 좋은 것 (Should Have)

| 기능 | 설명 | GTM |
|------|------|-----|
| 리뷰 좋아요 | 도움이 돼요 버튼 | Retention |
| **리뷰 좋아요 알림** | 내 리뷰가 좋아요 받으면 알림 (가장 강력한 재방문 트리거) | Retention |
| 상품 즐겨찾기 | 관심 상품 저장 | Retention |
| 리뷰 신고 | 부적절한 리뷰 신고 | - |
| 상품 정렬 | 평점순, 리뷰 많은 순, 최신순 | - |
| 홈 큐레이션 | 인기 상품, 신상품, 리뷰 많은 상품 섹션 | Retention |
| **"지금 핫한 상품" 섹션** | 최근 24h 리뷰 급증 상품 섹션 (FOMO 유도) | Retention |
| **"지금 할인 중" 섹션** | 할인가 적용된 상품 섹션 | Retention |
| **SNS 공유 카드 (OG)** | 상품/리뷰 Open Graph 메타 최적화 | Acquisition |
| 관리자: 리뷰 관리 | 신고 리뷰 확인/숨김 | - |

### 나중으로 미뤄도 되는 것 (Nice to Have / Post-MVP)

| 기능 | 설명 | GTM |
|------|------|-----|
| **바코드 스캔 리뷰** | 카메라로 바코드 → 상품 연결 → 즉시 리뷰 | Activation |
| **유저 뱃지/레벨 시스템** | 리뷰 수, 좋아요 기반 등급 (첫 리뷰어 뱃지 확장) | Retention |
| **SEO용 웹 상품 상세** | 검색 엔진 인덱싱을 위한 공개 웹 페이지 | Acquisition |
| **푸시 알림** | 즐겨찾기 상품 신규 리뷰, 신상품 알림 | Retention |
| 가격 히스토리 | 가격 변동 추적 | - |
| 행사/프로모션 정보 | 1+1, 2+1 등 행사 표시 | - |
| 랭킹 시스템 | 카테고리별 Top 10, 급상승 | - |
| 상품 자동 매칭 | 바코드/AI 기반 동일 상품 자동 판별 | - |
| 크롤링 파이프라인 | 리테일러 사이트 자동 수집 | - |
| 글로벌 확장 | 미국 등 다른 국가 활성화 | - |
| 리뷰 사진 첨부 | 리뷰에 이미지 업로드 | - |

---

## D. ERD / 도메인 모델 리뷰

### 현재 구조에서 개선할 점

#### 1. `reviews` 테이블 - 유니크 제약 추가

한 상품당 1리뷰 정책을 DB 레벨에서 보장:

```
UNIQUE (user_id, product_id)
```

**⚠️ 중요 변경 (리뷰 작성 UX 반영):**
- `taste_score`, `value_score`, `amount_score` 필드 **제거**
- 이유: 리뷰 작성 UX가 태그 기반 경량 폼으로 변경되어 다중 점수 필드는 이탈률을 높임
- 대체: 신규 `review_tags` 테이블로 맛/가성비/양 관련 태그 수집
- `body` 필드는 `NOT NULL DEFAULT ''`로 변경 (한 줄평이 선택 사항이므로)
- 상세: [REVIEW_COMPOSE_UX.md](./REVIEW_COMPOSE_UX.md)

#### 2. `products` 테이블 - `review_count`, `average_rating` 관리 전략

비정규화 필드로 성능상 맞지만, 갱신 전략이 필요:
- **방법 A (MVP 권장):** 리뷰 작성/수정/삭제 시 트리거 또는 애플리케이션 레벨에서 갱신
- **방법 B (스케일 후):** 배치 잡으로 주기적 재계산

#### 3. `review_images` 테이블 추가 (Post-MVP이지만 구조는 미리 고려)

MVP에서는 텍스트 리뷰만이지만, 테이블 설계 시 확장을 고려.

#### 4. `product_retailers` 뷰 또는 편의 쿼리

"이 상품을 어디서 파는가"를 자주 조회하므로, `retailer_products`에 적절한 인덱스 필수.

#### 5. 추가 권장 테이블

| 테이블 | 용도 | MVP 필요 여부 |
|--------|------|---------------|
| `review_tags` | 리뷰 태그 (맛있어요, 가성비 좋아요 등) | **Must (UX)** |
| `review_likes` | 리뷰 좋아요 | Should Have |
| `bookmarks` | 상품 즐겨찾기 | Should Have |
| `review_reports` | 리뷰 신고 | Should Have |
| `user_badges` | 유저 뱃지 (첫 리뷰어 등) | **Must (GTM)** |
| `badge_types` | 뱃지 종류 정의 | **Must (GTM)** |
| `analytics_events` | 리뷰 작성 깔때기 트래킹용 이벤트 로그 | **Must (GTM)** |
| `notifications` | 좋아요 받음 등 알림 | Should Have |
| `home_sections` | 홈 섹션 정의 (편집 홈) | **Must (Admin)** |
| `home_section_items` | 수동 섹션의 상품 연결 | **Must (Admin)** |
| `product_aliases` | 상품 병합 후 별칭 관리 | **Must (Admin)** |
| `admins` | 관리자 계정 | **Must (Admin)** |
| `admin_logs` | 관리자 작업 로그 | **Must (Admin)** |
| `product_images` | 상품 이미지 (복수) | Post-MVP |
| `price_histories` | 가격 변동 기록 | Post-MVP |

#### 6. GTM 관련 테이블 상세

**`user_badges`** (MVP 필수)
```
id, user_id, badge_type_id, product_id (nullable, 첫 리뷰어 뱃지용),
awarded_at
UNIQUE (user_id, badge_type_id, product_id)
```

**`badge_types`** (MVP 필수)
```
id, code ('first_reviewer'), name, description, icon_url, is_active
```

**`analytics_events`** (MVP 필수 - KPI 측정)
```
id, user_id (nullable), session_id, event_type, properties (jsonb),
occurred_at

event_type 예:
- product_viewed
- review_compose_started
- review_submitted
- search_performed
- search_result_clicked
```

주요 깔때기:
- `search_performed` → `search_result_clicked` → `product_viewed` → `review_compose_started` → `review_submitted`

**`notifications`** (Should Have)
```
id, user_id, type ('review_liked', 'new_product' 등),
title, body, data (jsonb), is_read, created_at
```

#### 7. 상품 상세 UX 관련 필드

상품 상세 페이지의 한 줄 요약을 위한 컬럼:

**`products.summary_line`** (MVP 필수)
```
VARCHAR(200), nullable
- MVP: 관리자 수동 입력
- Post-MVP: 리뷰 기반 자동 생성 (AI 요약 또는 top review title)
```

### 최종 ERD

```
┌──────────────┐
│  countries   │
│──────────────│
│ id (PK)      │
│ code         │──────────────────────────────────────┐
│ name_ko      │                                      │
│ name_en      │                                      │
│ currency_code│                                      │
│ language_code│                                      │
│ is_active    │                                      │
└──────┬───────┘                                      │
       │                                              │
       │ 1:N                                          │ 1:N
       │                                              │
┌──────▼───────┐     ┌──────────────┐     ┌───────────▼──┐
│  retailers   │     │   brands     │     │  categories  │
│──────────────│     │──────────────│     │──────────────│
│ id (PK)      │     │ id (PK)      │     │ id (PK)      │
│ country_id   │     │ name         │     │ country_id   │
│ name         │     │ name_en      │     │ parent_id    │
│ slug         │     │ slug         │     │ name         │
│ retailer_type│     │ logo_url     │     │ slug         │
│ logo_url     │     │ is_active    │     │ depth        │
│ launch_status│     └──────┬───────┘     │ display_order│
│ display_order│            │             │ icon_url     │
│ is_active    │            │ 1:N         │ is_active    │
└──────┬───────┘            │             └──────┬───────┘
       │                    │                    │
       │ 1:N         ┌─────▼────────────────────▼──┐
       │             │       products               │
       │             │─────────────────────────────│
       │             │ id (PK)                      │
       │             │ country_id (FK)               │
       │             │ brand_id (FK)                 │
       │             │ category_id (FK)              │
       │             │ name                          │
       │             │ normalized_name               │
       │             │ description                   │
       │             │ image_url                     │
       │             │ barcode                       │
       │             │ volume_value                  │
       │             │ volume_unit                   │
       │             │ package_type                  │
       │             │ status                        │
       │             │ review_count                  │
       │             │ average_rating                │
       │             │ created_at                    │
       │             │ updated_at                    │
       │             └──────┬───────────────────────┘
       │                    │
       │ 1:N                │ 1:N
       │                    │
┌──────▼────────────────────▼──┐
│     retailer_products        │
│─────────────────────────────│
│ id (PK)                      │
│ retailer_id (FK)             │
│ product_id (FK)              │
│ retailer_product_name        │
│ retailer_product_url         │
│ price                        │
│ sale_price                   │
│ currency_code                │
│ is_available                 │
│ is_new                       │
│ is_limited                   │
│ source_type                  │
│ last_synced_at               │
│ created_at                   │
│ updated_at                   │
│                              │
│ UNIQUE(retailer_id,          │
│        product_id)           │
└──────────────────────────────┘

┌──────────────┐
│    users     │
│──────────────│
│ id (PK)      │
│ email        │
│ social_provider│
│ social_id    │
│ nickname     │
│ profile_image│
│ country_id   │
│ status       │
│ created_at   │
│ updated_at   │
└──────┬───────┘
       │
       │ 1:N
       │
┌──────▼───────────────────────┐
│         reviews              │
│─────────────────────────────│
│ id (PK)                      │
│ user_id (FK)                 │
│ product_id (FK)              │
│ retailer_id (FK, nullable)   │
│ rating (1-5)                 │
│ title (nullable)             │
│ body (default '')            │
│ repurchase_intent (boolean)  │
│ moderation_status            │
│ reported_count               │
│ like_count                   │
│ created_at                   │
│ updated_at                   │
│                              │
│ UNIQUE(user_id, product_id)  │
└──────┬───────────────────────┘
       │
       │ 1:N
       │
┌──────▼───────────────────────┐
│       review_tags            │
│─────────────────────────────│
│ id (PK)                      │
│ review_id (FK CASCADE)       │
│ tag_code (varchar)           │
│ created_at                   │
│                              │
│ UNIQUE(review_id, tag_code)  │
└──────────────────────────────┘

┌──────────────────────────────┐
│       review_likes           │
│─────────────────────────────│
│ id (PK)                      │
│ user_id (FK)                 │
│ review_id (FK)               │
│ created_at                   │
│                              │
│ UNIQUE(user_id, review_id)   │
└──────────────────────────────┘

┌──────────────────────────────┐
│        bookmarks             │
│─────────────────────────────│
│ id (PK)                      │
│ user_id (FK)                 │
│ product_id (FK)              │
│ created_at                   │
│                              │
│ UNIQUE(user_id, product_id)  │
└──────────────────────────────┘

┌──────────────────────────────┐
│      review_reports          │
│─────────────────────────────│
│ id (PK)                      │
│ review_id (FK)               │
│ reporter_user_id (FK)        │
│ reason                       │
│ description                  │
│ status (pending/resolved/    │
│         dismissed)           │
│ resolved_by                  │
│ created_at                   │
│ resolved_at                  │
└──────────────────────────────┘
```

### 핵심 인덱스

```sql
-- 리테일러별 상품 조회 (가장 빈번한 쿼리)
CREATE INDEX idx_retailer_products_retailer_id ON retailer_products(retailer_id, is_available);

-- 상품별 리뷰 조회
CREATE INDEX idx_reviews_product_id ON reviews(product_id, moderation_status, created_at DESC);

-- 리테일러별 리뷰 필터
CREATE INDEX idx_reviews_product_retailer ON reviews(product_id, retailer_id);

-- 카테고리별 상품 조회
CREATE INDEX idx_products_category ON products(category_id, country_id, status);

-- 브랜드별 상품 조회
CREATE INDEX idx_products_brand ON products(brand_id, country_id);

-- 상품 검색 (normalized_name 기반)
CREATE INDEX idx_products_normalized_name ON products(normalized_name);

-- 유저별 리뷰 조회
CREATE INDEX idx_reviews_user ON reviews(user_id, created_at DESC);

-- 유저별 즐겨찾기
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id, created_at DESC);

-- 국가별 리테일러 조회
CREATE INDEX idx_retailers_country ON retailers(country_id, is_active, display_order);

-- 국가별 카테고리 조회
CREATE INDEX idx_categories_country ON categories(country_id, parent_id, display_order);
```

### 설계 결정 사항

| 항목 | 결정 | 이유 |
|------|------|------|
| 리뷰 귀속 | Product 기준 | 동일 상품 통합 리뷰가 핵심 가치 |
| `is_recommended` 컬럼 제거 | `repurchase_intent`로 대체 | MVP에서 축 단순화. 추천/재구매 둘 다 두면 유저 혼란 |
| `retailer_id` in Review | nullable FK | 구매처 모를 수도 있음 (선물 받은 경우 등) |
| Review 서브점수 | taste, value, amount 3개 | MVP 최소. 맛/가성비/양이 식품 리뷰 핵심 축 |
| 카테고리 depth | 최대 2단계 | MVP에서 대분류만. 소분류는 데이터 쌓이면 추가 |

---

## E. API 초안

### 인증

```
POST   /api/v1/auth/kakao          카카오 소셜 로그인
POST   /api/v1/auth/apple           애플 소셜 로그인
POST   /api/v1/auth/refresh         토큰 갱신
DELETE /api/v1/auth/logout           로그아웃
```

### 국가

```
GET    /api/v1/countries                         활성 국가 목록
```

Response:
```json
{
  "countries": [
    {
      "id": 1,
      "code": "KR",
      "name_ko": "한국",
      "name_en": "South Korea",
      "currency_code": "KRW"
    }
  ]
}
```

### 리테일러

```
GET    /api/v1/countries/:countryCode/retailers   국가별 리테일러 목록
GET    /api/v1/retailers/:retailerId              리테일러 상세
```

Response (목록):
```json
{
  "retailers": [
    {
      "id": 1,
      "name": "GS25",
      "slug": "gs25",
      "retailer_type": "convenience_store",
      "logo_url": "...",
      "launch_status": "active",
      "product_count": 342
    },
    {
      "id": 5,
      "name": "Costco",
      "slug": "costco",
      "retailer_type": "warehouse",
      "logo_url": "...",
      "launch_status": "coming_soon",
      "product_count": 0
    }
  ]
}
```

### 카테고리

```
GET    /api/v1/countries/:countryCode/categories  국가별 카테고리 목록 (트리 구조)
```

### 상품

```
GET    /api/v1/retailers/:retailerId/products     리테일러별 상품 목록
       ?category_id=3
       &sort=rating|review_count|newest
       &cursor=...
       &limit=20

GET    /api/v1/products/search                    상품 검색
       ?q=하리보
       &country_code=KR
       &category_id=2
       &cursor=...
       &limit=20

GET    /api/v1/products/:productId                상품 상세
```

Response (상품 상세):
```json
{
  "product": {
    "id": 101,
    "name": "하리보 골드베렌 100g",
    "summary_line": "달긴 한데 계속 손이 가는 젤리",
    "brand": {
      "id": 5,
      "name": "하리보",
      "logo_url": "..."
    },
    "category": {
      "id": 2,
      "name": "젤리"
    },
    "image_url": "...",
    "barcode": "8691216025103",
    "volume": "100g",
    "package_type": "bag",
    "average_rating": 4.2,
    "review_count": 47,
    "rating_distribution": {
      "5": 18, "4": 15, "3": 8, "2": 4, "1": 2
    },
    "average_scores": {
      "taste": 4.3,
      "value": 3.5,
      "amount": 3.8
    },
    "tag_counts": {
      "taste_good": 32,
      "value_good": 24,
      "amount_small": 12
    },
    "repurchase_rate": 78.5,
    "my_review": {
      "exists": false,
      "review_id": null
    },
    "retailers": [
      {
        "retailer_id": 1,
        "retailer_name": "GS25",
        "price": 2500,
        "sale_price": null,
        "is_available": true,
        "is_new": false,
        "review_count_from_here": 23
      },
      {
        "retailer_id": 2,
        "retailer_name": "CU",
        "price": 2800,
        "sale_price": 2500,
        "is_available": true,
        "is_new": false,
        "review_count_from_here": 15
      }
    ]
  }
}
```

> 📌 상품 상세 UX 상세 설계: [PRODUCT_DETAIL_UX.md](./PRODUCT_DETAIL_UX.md)
>
> 섹션 구조, 케이스별 리뷰 전환 UI, 상단/하단 CTA 전략, 리뷰 작성 진입 플로우 상세 정의.

### 리뷰

```
GET    /api/v1/products/:productId/reviews        상품별 리뷰 목록
       ?retailer_id=1                              (리테일러 필터, 선택)
       &sort=newest|helpful|rating_high|rating_low
       &cursor=...
       &limit=20

POST   /api/v1/products/:productId/reviews        리뷰 작성
PUT    /api/v1/reviews/:reviewId                   리뷰 수정
DELETE /api/v1/reviews/:reviewId                   리뷰 삭제

GET    /api/v1/users/me/reviews                    내 리뷰 목록
```

Request (리뷰 작성):
```json
{
  "retailer_id": 1,
  "rating": 4,
  "body": "생각보다 맛있는데 조금 달아요",
  "tags": ["taste_good", "taste_sweet", "value_good", "repurchase_yes"]
}
```

필드 규칙:
- `rating`: **필수** (1~5)
- `body`: 선택 (빈 문자열 허용, 최대 2000자)
- `tags`: 선택 (허용된 `tag_code` 배열)
- `retailer_id`: 선택 (nullable)
- `repurchase_intent`: 서버에서 `tags`에 `repurchase_yes` 포함 여부로 자동 결정

Response (리뷰 작성 성공):
```json
{
  "review": {
    "id": 501,
    "rating": 4,
    "body": "생각보다 맛있는데 조금 달아요",
    "tags": ["taste_good", "taste_sweet", "value_good", "repurchase_yes"],
    "repurchase_intent": true,
    "created_at": "2026-04-10T10:30:00Z"
  },
  "awarded_badges": [
    {
      "code": "first_reviewer",
      "name": "첫 리뷰어",
      "icon_url": "..."
    }
  ]
}
```

Response (리뷰 목록):
```json
{
  "reviews": [
    {
      "id": 501,
      "user": {
        "id": 10,
        "nickname": "젤리러버",
        "profile_image_url": "...",
        "badges": ["first_reviewer"]
      },
      "retailer": {
        "id": 1,
        "name": "GS25"
      },
      "rating": 4,
      "body": "생각보다 맛있는데 조금 달아요",
      "tags": ["taste_good", "value_good", "repurchase_yes"],
      "repurchase_intent": true,
      "like_count": 12,
      "is_liked_by_me": false,
      "created_at": "2026-04-01T10:30:00Z",
      "updated_at": null
    }
  ],
  "pagination": {
    "next_cursor": "...",
    "has_next": true
  },
  "summary": {
    "total_count": 47,
    "filtered_count": 23
  }
}
```

> 📌 리뷰 작성 UX 상세 설계: [REVIEW_COMPOSE_UX.md](./REVIEW_COMPOSE_UX.md)
>
> 단일 화면 플로우, 별점→태그→구매처→텍스트 순서, 전환율 트릭, 로그인 타이밍, 케이스별 CTA 상세 정의.

### 리뷰 좋아요

```
POST   /api/v1/reviews/:reviewId/like             좋아요
DELETE /api/v1/reviews/:reviewId/like             좋아요 취소
```

### 리뷰 신고

```
POST   /api/v1/reviews/:reviewId/report           리뷰 신고
```

Request:
```json
{
  "reason": "spam",
  "description": "광고성 리뷰입니다"
}
```

### 즐겨찾기

```
POST   /api/v1/products/:productId/bookmark       즐겨찾기 추가
DELETE /api/v1/products/:productId/bookmark       즐겨찾기 삭제
GET    /api/v1/users/me/bookmarks                  내 즐겨찾기 목록
```

### 유저

```
GET    /api/v1/users/me                            내 프로필
PUT    /api/v1/users/me                            프로필 수정
DELETE /api/v1/users/me                            회원 탈퇴
GET    /api/v1/users/me/badges                     내 뱃지 목록
GET    /api/v1/users/:userId/badges                유저 뱃지 (공개)
```

### 뱃지 (GTM - Activation)

```
GET    /api/v1/badge-types                         전체 뱃지 종류 (설명/아이콘)
```

뱃지는 서버에서 이벤트 기반으로 자동 부여:
- **first_reviewer**: 리뷰 제출 시 해당 상품의 첫 리뷰라면 부여
- 부여 로직은 `POST /api/v1/products/:productId/reviews` 내부에서 트랜잭션으로 처리

### 알림 (GTM - Retention)

```
GET    /api/v1/notifications                       내 알림 목록
PUT    /api/v1/notifications/:id/read              알림 읽음 처리
PUT    /api/v1/notifications/read-all              전체 읽음
GET    /api/v1/notifications/unread-count          읽지 않은 알림 수
```

### 분석 이벤트 (GTM - KPI 측정)

```
POST   /api/v1/analytics/events                    클라이언트 이벤트 기록 (배치 가능)
```

Request:
```json
{
  "events": [
    {
      "event_type": "product_viewed",
      "properties": {
        "product_id": 101,
        "source": "search",
        "search_query": "하리보"
      },
      "occurred_at": "2026-04-10T10:30:00Z"
    },
    {
      "event_type": "review_compose_started",
      "properties": { "product_id": 101 },
      "occurred_at": "2026-04-10T10:30:15Z"
    }
  ]
}
```

서버에서 `review_submitted`는 리뷰 작성 API 내부에서 자동 기록하고, 클라이언트는 이탈 지점(`review_compose_started` 등)만 보고.

### 홈

```
GET    /api/v1/countries/:countryCode/home         홈 화면 데이터
```

Response:
```json
{
  "sections": [
    {
      "type": "new_this_week",
      "title": "이번 주 편의점 신상",
      "emoji": "🔥",
      "products": [...]
    },
    {
      "type": "trending",
      "title": "지금 핫한 상품",
      "emoji": "📈",
      "products": [...]
    },
    {
      "type": "popular_by_retailer",
      "title": "GS25 인기 상품",
      "emoji": "🏪",
      "retailer": { "id": 1, "name": "GS25", "slug": "gs25" },
      "products": [...],
      "more_url": "/api/v1/retailers/1/products?sort=popular"
    },
    {
      "type": "popular_by_retailer",
      "title": "CU 인기 상품",
      "emoji": "🏪",
      "retailer": { "id": 2, "name": "CU", "slug": "cu" },
      "products": [...]
    },
    {
      "type": "categories",
      "title": "카테고리",
      "emoji": "🎯",
      "categories": [...]
    },
    {
      "type": "on_sale",
      "title": "지금 할인 중",
      "emoji": "💰",
      "products": [...]
    }
  ]
}
```

> 📌 홈 UX 상세 설계: [HOME_UX.md](./HOME_UX.md)
>
> 섹션 구조, 카드 디자인, 트리거 설계, 섹션별 쿼리 조건, 뱃지 시스템 상세 정의.

---

## F. 관리자 콘솔

> 📌 상세 설계: [ADMIN_CONSOLE.md](./ADMIN_CONSOLE.md)
>
> 관리자 페이지는 **운영 콘솔**이다. 예쁠 필요 없고 빠르고 명확해야 한다. 운영자가 매일 해야 하는 4가지 일(상품 등록/수정, 리테일러 연결, 리뷰 관리, 홈 운영)이 바로 보여야 한다.

### 관리자 4대 핵심 활동

| 활동 | 화면 | 빈도 |
|------|------|------|
| 신상품을 빨리 넣는다 | 상품 등록 → 리테일러 연결 | 매일 |
| 중복 상품을 정리한다 | 상품 병합 | 주간 |
| 이상 리뷰를 처리한다 | 리뷰 관리 | 매일 |
| 홈을 살아있게 유지한다 | 홈 운영 | 주간 |

### 1차 MVP 필수 화면

| # | 화면 | 목적 |
|---|------|------|
| 1 | 로그인 | 보안 |
| 2 | 대시보드 (단순) | "운영 필요 항목" 중심 |
| 3 | 상품 목록 | 검색/필터/상태 관리 |
| 4 | 상품 등록/수정 | 브랜드·카테고리 자동완성 필수 |
| 5 | 리테일러 상품 관리 | 상품↔리테일러 연결, 가격 관리 |
| 6 | 리뷰 관리 | 목록/필터/숨김/신고 처리 |
| 7 | 홈 운영 | 섹션별 활성/순서/조건 관리 |
| 8 | 상품 병합 (수동) | 동일 상품 통합, 리뷰 이관 |

### 2차 (런칭 후)

- 브랜드 관리, 카테고리 관리, 리테일러 관리 (초기엔 시드로 충분)
- 신고 처리 전용 화면

### 3차 (나중)

- 병합 후보 자동 추천 (유사도 기반)
- 대시보드 고도화 (통계 그래프)
- 벌크 업로드 (CSV)
- 관리자 권한/역할 분리

### 🚨 운영 필요 항목 (대시보드 핵심 블록)

대시보드는 숫자를 보는 곳이 아니라 **할 일을 보는 곳**이다:

- 리뷰 없는 신상품 (등록 후 3일+ 지났는데 리뷰 0개)
- 리테일러 미연결 상품
- 숨김 검토 필요 리뷰 (신고 누적)
- coming_soon 상태인데 상품 0개인 리테일러

### ⚠️ 치명적 UX 요건

| 요건 | 이유 |
|------|------|
| **브랜드·카테고리 자동완성 필수** | 매번 새 입력 → 데이터 오염 |
| **리테일러 상품 폼의 상품 검색 자동완성 필수** | 없으면 신상품 추가 포기 |
| **"저장 후 리테일러 연결하기" 버튼** | 가장 빈번한 운영 동선 |
| **데스크톱 전용 (모바일 대응 X)** | 테이블 중심 운영, 모바일 불필요 |

### 관리자 API

```
# 인증
POST   /api/admin/v1/auth/login

# 대시보드
GET    /api/admin/v1/dashboard/stats
GET    /api/admin/v1/dashboard/action-items

# 상품
GET    /api/admin/v1/products
POST   /api/admin/v1/products
PUT    /api/admin/v1/products/:id
DELETE /api/admin/v1/products/:id
GET    /api/admin/v1/products/autocomplete?q=...
GET    /api/admin/v1/products/merge-candidates
POST   /api/admin/v1/products/:id/merge
       body: { "target_product_id": 456, "create_alias": true }

# 브랜드 / 카테고리 / 리테일러
GET    /api/admin/v1/brands
POST   /api/admin/v1/brands
PUT    /api/admin/v1/brands/:id
GET    /api/admin/v1/brands/autocomplete?q=...

GET    /api/admin/v1/categories
POST   /api/admin/v1/categories
PUT    /api/admin/v1/categories/:id
GET    /api/admin/v1/categories/autocomplete?q=...

GET    /api/admin/v1/retailers
PUT    /api/admin/v1/retailers/:id

# 리테일러-상품 연결
GET    /api/admin/v1/retailer-products
POST   /api/admin/v1/retailer-products
PUT    /api/admin/v1/retailer-products/:id
DELETE /api/admin/v1/retailer-products/:id

# 리뷰 관리
GET    /api/admin/v1/reviews?moderation_status=reported
PUT    /api/admin/v1/reviews/:id/moderate
       body: { "action": "hide" | "approve" | "dismiss", "admin_note": "..." }

# 리뷰 신고
GET    /api/admin/v1/review-reports?status=pending
PUT    /api/admin/v1/review-reports/:id
       body: { "status": "resolved" | "dismissed" }

# 홈 운영
GET    /api/admin/v1/home-sections
POST   /api/admin/v1/home-sections
PUT    /api/admin/v1/home-sections/:id
DELETE /api/admin/v1/home-sections/:id
PUT    /api/admin/v1/home-sections/reorder
       body: { "ids": [3, 1, 2, 4] }

# 수동 섹션 상품 관리
GET    /api/admin/v1/home-sections/:id/items
POST   /api/admin/v1/home-sections/:id/items
DELETE /api/admin/v1/home-sections/:id/items/:itemId
PUT    /api/admin/v1/home-sections/:id/items/reorder

# 운영 로그
GET    /api/admin/v1/logs?admin_id=1&target_type=review
```

---

## G. 오픈 이슈 / 의사결정 필요 항목

### 즉시 결정 필요

| # | 이슈 | 선택지 | 추천 |
|---|------|--------|------|
| 1 | **기술 스택** | A) React Native + Node.js B) Flutter + Node.js C) 네이티브(Swift/Kotlin) + Node.js | **B) Flutter + Node.js (NestJS)** — 1인/소규모 개발에서 크로스플랫폼 효율 극대화. Flutter의 UI 표현력이 리뷰 앱에 적합 |
| 2 | **DB** | A) PostgreSQL B) MySQL | **A) PostgreSQL** — JSON 지원, 전문 검색(한글), 확장성 |
| 3 | **MVP 리테일러 범위** | A) 편의점 4개만 B) 편의점 4개 + Costco/트레이더스 coming_soon | **B)** — 구조만 미리 열고 실제 운영은 편의점 집중 |
| 4 | **모바일 vs 웹** | A) 앱 우선 B) 웹 우선 C) 동시 | **A) 앱 우선** — 리뷰 앱 특성상 모바일이 주력. 웹은 SEO/공유용으로 Post-MVP |
| 5 | **초기 상품 데이터** | A) 관리자 수동 입력 B) 크롤링 C) 유저 제보 | **A) 수동 입력** — MVP에서는 관리자가 주요 상품 200~300개 직접 등록. 크롤링은 법적 리스크 + 개발 비용 |

### 제품 방향 논의 필요

| # | 이슈 | 논점 |
|---|------|------|
| 6 | 리뷰 수정 vs 재작성 | 수정 시 이전 내용을 남길지, 완전히 덮어쓸지 |
| 7 | 리뷰 최소 길이 | 한줄평만 허용할지, 최소 글자수(예: 20자)를 둘지 |
| 8 | 별점 없는 리뷰 | 별점 필수로 할지, 텍스트만 가능하게 할지 |
| 9 | 비로그인 탐색 | 리뷰 읽기는 비로그인 허용할지 |
| 10 | 닉네임 정책 | 중복 허용할지, 유니크 강제할지 |
| 11 | 상품 없을 때 | 유저가 찾는 상품이 없으면 "등록 요청" 기능을 둘지 |

---

## H. 다음 단계 제안

### Phase 1: 설계 확정 (1주)

- [ ] 위 오픈 이슈 항목 결정
- [ ] 기술 스택 최종 확정
- [ ] 와이어프레임/화면 설계 (Figma)
- [ ] DB 스키마 최종 확정 및 마이그레이션 파일 작성
- [ ] API 스펙 최종 확정 (OpenAPI/Swagger)

### Phase 2: 백엔드 MVP (2~3주)

- [ ] 프로젝트 셋업 (NestJS + PostgreSQL + TypeORM/Prisma)
- [ ] 인증 모듈 (카카오/애플 소셜 로그인)
- [ ] 핵심 CRUD API (국가, 리테일러, 카테고리, 상품, 리뷰)
- [ ] 검색 API (PostgreSQL full-text search, 한글 형태소)
- [ ] 관리자 API
- [ ] 초기 시드 데이터 (한국, 편의점 4개, 카테고리 6개, 상품 50~100개)

### Phase 3: 프론트엔드 MVP (2~3주)

- [ ] Flutter 프로젝트 셋업
- [ ] 온보딩 / 로그인
- [ ] 홈 화면 (리테일러 목록, 큐레이션 섹션)
- [ ] 리테일러 상세 (카테고리별 상품 리스트)
- [ ] 상품 상세 (리뷰 통합, 리테일러별 필터)
- [ ] 리뷰 작성/수정
- [ ] 검색
- [ ] 마이페이지

### Phase 4: 관리자 웹 (1~2주)

- [ ] 관리자 웹 (React 또는 Next.js)
- [ ] 상품/브랜드/카테고리 CRUD
- [ ] RetailerProduct 연결 관리
- [ ] 리뷰 신고 관리

### Phase 5: 베타 런칭

- [ ] 초기 상품 데이터 200~300개 입력
- [ ] 클로즈드 베타 (지인/커뮤니티 대상)
- [ ] 피드백 수집 및 개선
- [ ] 앱스토어/플레이스토어 출시 준비

---

## 부록: 기술 스택 추천 (참고)

| 영역 | 추천 | 이유 |
|------|------|------|
| 모바일 | Flutter | 크로스플랫폼, UI 표현력, 1인 개발 효율 |
| 백엔드 | NestJS (TypeScript) | 구조화된 프레임워크, TypeScript 통일 |
| DB | PostgreSQL | 전문 검색, JSON, 안정성 |
| ORM | Prisma | 타입 안전, 마이그레이션 관리 |
| 인증 | JWT + OAuth2 (카카오, 애플) | 모바일 소셜 로그인 표준 |
| 이미지 저장 | AWS S3 + CloudFront | 비용 효율, CDN |
| 배포 | AWS (EC2/ECS) 또는 Railway/Fly.io | MVP는 Railway 추천 (운영 부담 최소) |
| 관리자 웹 | Next.js 또는 React + Ant Design | 빠른 어드민 구축 |
| API 문서 | Swagger (nestjs/swagger) | 자동 생성, 프론트 협업 |
