# CartPick

> See what others think before you add to cart

마트/편의점 상품 리뷰 플랫폼 — 사기 전에 먹어본 사람한테 물어보자.

## Monorepo Structure

```
cartpick/
├── apps/
│   ├── api/          # NestJS API 서버
│   ├── mobile/       # Flutter 모바일 앱
│   └── admin/        # Next.js 관리자 웹
├── packages/
│   ├── shared/       # 공유 유틸리티, 상수
│   ├── types/        # 공유 TypeScript 타입 정의
│   └── eslint-config/# 공유 ESLint 설정
└── docs/
    ├── prd/          # 제품 요구사항 문서
    ├── erd/          # 데이터베이스 설계
    └── api/          # API 스펙 문서
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Mobile | Flutter (Dart) |
| API Server | NestJS (TypeScript) |
| Admin Web | Next.js (TypeScript) |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT + OAuth2 (Kakao, Apple) |
| Image Storage | AWS S3 + CloudFront |
| Monorepo | pnpm workspaces + Turborepo |

## Getting Started

```bash
# Install dependencies
pnpm install

# Run API server
pnpm --filter @cartpick/api dev

# Run admin web
pnpm --filter @cartpick/admin dev
```

## Scripts

```bash
pnpm dev        # Run all apps in dev mode
pnpm build      # Build all apps
pnpm lint       # Lint all packages
pnpm test       # Run all tests
pnpm db:migrate # Run database migrations
pnpm db:seed    # Seed initial data
```
