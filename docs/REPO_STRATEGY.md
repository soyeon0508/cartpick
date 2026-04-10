# CartPick 모노레포 관리 전략

## 1. 디렉토리 구조

```
cartpick/
├── apps/
│   ├── api/                  # NestJS API 서버
│   │   ├── prisma/
│   │   │   ├── schema.prisma # DB 스키마 정의
│   │   │   ├── migrations/   # 마이그레이션 히스토리
│   │   │   └── seed.ts       # 초기 시드 데이터
│   │   ├── src/
│   │   │   ├── modules/      # 도메인별 모듈
│   │   │   │   ├── auth/
│   │   │   │   ├── country/
│   │   │   │   ├── retailer/
│   │   │   │   ├── category/
│   │   │   │   ├── brand/
│   │   │   │   ├── product/
│   │   │   │   ├── review/
│   │   │   │   ├── user/
│   │   │   │   └── admin/
│   │   │   ├── common/       # 가드, 인터셉터, 필터, 파이프
│   │   │   ├── config/       # 환경 설정
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── test/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── nest-cli.json
│   │
│   ├── mobile/               # Flutter 모바일 앱
│   │   ├── lib/
│   │   │   ├── app/          # 앱 진입점, 라우팅
│   │   │   ├── features/     # 기능별 모듈
│   │   │   │   ├── auth/
│   │   │   │   ├── home/
│   │   │   │   ├── retailer/
│   │   │   │   ├── product/
│   │   │   │   ├── review/
│   │   │   │   ├── search/
│   │   │   │   └── profile/
│   │   │   ├── core/         # DI, 네트워크, 스토리지
│   │   │   └── shared/       # 공통 위젯, 테마
│   │   ├── assets/
│   │   ├── pubspec.yaml
│   │   └── analysis_options.yaml
│   │
│   └── admin/                # Next.js 관리자 웹
│       ├── src/
│       │   ├── app/          # App Router 페이지
│       │   │   ├── products/
│       │   │   ├── brands/
│       │   │   ├── categories/
│       │   │   ├── retailers/
│       │   │   ├── reviews/
│       │   │   └── layout.tsx
│       │   ├── components/   # UI 컴포넌트
│       │   ├── hooks/        # 커스텀 훅
│       │   └── lib/          # API 클라이언트, 유틸
│       ├── package.json
│       ├── tsconfig.json
│       └── next.config.js
│
├── packages/
│   ├── shared/               # API/Admin 공유 유틸, 상수
│   │   └── src/
│   │       └── index.ts
│   ├── types/                # API/Admin 공유 타입 정의
│   │   └── src/
│   │       └── index.ts
│   └── eslint-config/        # 공유 ESLint 설정
│
├── docs/
│   ├── prd/                  # PRD 문서
│   ├── erd/                  # ERD 다이어그램, SQL
│   └── api/                  # API 스펙 문서
│
├── .github/
│   └── workflows/            # CI/CD
│       ├── api.yml
│       ├── admin.yml
│       └── lint.yml
│
├── package.json              # 루트 (워크스페이스 설정)
├── pnpm-workspace.yaml       # pnpm 워크스페이스
├── turbo.json                # Turborepo 설정
├── .gitignore
├── .nvmrc
└── README.md
```

## 2. 도구 선택 이유

### pnpm workspaces
- **왜?** npm/yarn 대비 디스크 효율 (심볼릭 링크), 엄격한 의존성 해석 (phantom dependency 방지)
- `workspace:*` 프로토콜로 패키지 간 참조

### Turborepo
- **왜?** 태스크 그래프 기반 빌드 오케스트레이션, 캐싱
- `turbo run build` → 의존성 순서대로 빌드 (`types` → `shared` → `api`, `admin`)
- 변경된 패키지만 재빌드 (incremental)

### Flutter는 pnpm 밖에 존재
- Flutter는 Dart/pub 생태계이므로 pnpm workspace에 포함되지 않음
- `apps/mobile/` 은 독립적인 Flutter 프로젝트
- Turborepo에서도 별도 관리 (turbo 파이프라인에서 제외하거나, 커스텀 스크립트로 연동)

## 3. 패키지 간 의존성

```
@cartpick/types    ← 의존성 없음 (leaf)
       ↑
@cartpick/shared   ← @cartpick/types
       ↑
@cartpick/api      ← @cartpick/shared, @cartpick/types
@cartpick/admin    ← @cartpick/shared, @cartpick/types

apps/mobile        ← 독립 (Dart 생태계, API 타입은 코드젠 또는 수동 동기화)
```

### Mobile ↔ Types 동기화 전략

Flutter는 TypeScript 타입을 직접 참조할 수 없으므로:

| 방법 | 설명 | 추천 시점 |
|------|------|-----------|
| **수동 동기화** | `packages/types`를 보고 Dart 모델 수동 작성 | MVP |
| **OpenAPI 코드젠** | API에서 Swagger 스펙 생성 → `openapi-generator`로 Dart 클라이언트 자동 생성 | Post-MVP |

## 4. 브랜치 전략

### Git Flow (간소화)

```
main              ← 프로덕션 배포 브랜치
  └── develop     ← 개발 통합 브랜치
       ├── feat/product-crud     ← 기능 브랜치
       ├── feat/review-api
       ├── fix/rating-calc
       └── chore/ci-setup
```

### 브랜치 네이밍

| 접두사 | 용도 | 예시 |
|--------|------|------|
| `feat/` | 새 기능 | `feat/review-write` |
| `fix/` | 버그 수정 | `fix/rating-null-error` |
| `chore/` | 설정, CI, 리팩토링 | `chore/eslint-setup` |
| `docs/` | 문서 | `docs/api-spec-update` |
| `hotfix/` | 긴급 프로덕션 수정 | `hotfix/login-crash` |

### 규칙
- `main` 직접 push 금지 → PR 필수
- PR 머지 전 최소 lint 통과 (CI)
- 1인 개발 시 `develop` 생략하고 `main` + feature branch도 OK

## 5. 커밋 컨벤션

### Conventional Commits + Scope

```
<type>(<scope>): <description>

feat(api): add product CRUD endpoints
fix(admin): fix category tree rendering
chore(root): configure turborepo caching
docs(prd): update MVP scope definition
feat(mobile): implement retailer list screen
fix(types): correct Review type nullable fields
```

### Scope 목록

| Scope | 대상 |
|-------|------|
| `api` | `apps/api` |
| `admin` | `apps/admin` |
| `mobile` | `apps/mobile` |
| `types` | `packages/types` |
| `shared` | `packages/shared` |
| `root` | 루트 설정 (turbo, pnpm, CI 등) |
| `docs` | `docs/` |
| `prisma` | DB 스키마, 마이그레이션 |

## 6. CI/CD 전략

### GitHub Actions 파이프라인

```yaml
# 모든 PR에서 실행
on: pull_request

jobs:
  lint:     # turbo run lint (변경된 패키지만)
  test-api: # apps/api 테스트 (변경 시에만)
  build:    # turbo run build (전체 빌드 검증)
```

### 배포 파이프라인

| 앱 | 트리거 | 대상 |
|----|--------|------|
| API | `main` 머지 + `apps/api/**` 변경 | Railway / AWS ECS |
| Admin | `main` 머지 + `apps/admin/**` 변경 | Vercel |
| Mobile | 수동 / 태그 (`v0.1.0`) | App Store / Play Store |

### Turborepo + CI 최적화
- `turbo run build --filter=...[HEAD~1]` → 변경된 패키지만 빌드
- Remote cache (Turborepo) 또는 GitHub Actions cache 활용

## 7. 환경변수 관리

### 파일 구조

```
cartpick/
├── .env.example              # 루트 환경변수 템플릿
├── apps/api/.env.example     # API 환경변수 템플릿
├── apps/api/.env             # API 로컬 환경변수 (gitignore)
├── apps/admin/.env.example
└── apps/admin/.env.local
```

### API 환경변수 예시 (.env.example)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cartpick

# Auth
JWT_SECRET=your-jwt-secret
JWT_EXPIRY=7d
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=

# AWS S3
AWS_S3_BUCKET=
AWS_S3_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# App
PORT=3000
NODE_ENV=development
```

## 8. 개발 워크플로우

### 일상적인 개발 흐름

```bash
# 1. 브랜치 생성
git checkout -b feat/product-crud

# 2. API 개발
pnpm --filter @cartpick/api dev       # API 서버 시작

# 3. 타입 변경 시
# packages/types/src/index.ts 수정 → API/Admin 자동 반영

# 4. DB 스키마 변경 시
cd apps/api
pnpm prisma:migrate                    # 마이그레이션 생성
pnpm prisma:generate                   # Prisma Client 재생성

# 5. 전체 빌드 확인
pnpm build                             # turbo로 전체 빌드

# 6. 커밋
git add .
git commit -m "feat(api): add product CRUD endpoints"

# 7. PR 생성
gh pr create
```

### 새 팀원 온보딩

```bash
git clone https://github.com/soyeon0508/cartpick.git
cd cartpick
pnpm install                           # 모든 의존성 설치
cp apps/api/.env.example apps/api/.env # 환경변수 설정
pnpm db:migrate                        # DB 마이그레이션
pnpm db:seed                           # 시드 데이터
pnpm dev                               # 전체 개발 서버 시작
```

## 9. 버전 관리

### MVP 단계
- 단일 버전 (`0.x.y`) — 아직 퍼블릭 API 없으므로 시맨틱 버저닝 부담 없음
- `package.json`의 version은 참고용

### 릴리스 이후
- Git 태그로 릴리스 관리: `v0.1.0`, `v0.2.0`
- 모바일 앱은 별도 버전 체계 (App Store/Play Store 버전)
- API 버전은 URL prefix (`/api/v1/`)로 관리
