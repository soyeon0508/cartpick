# CartPick 개발 계획

## 마일스톤 정의

### M1: 뼈대 (Week 1)

**목표:** "관리자 로그인 → 상품 1개 등록 → public API로 조회 가능"

| TASK | 내용 | 산출물 |
|------|------|--------|
| TASK 1 | NestJS bootstrap + Docker + 설정 | `docker compose up` + `/health` 200 OK |
| TASK 2 | Prisma schema 전체 작성 + migration | `prisma migrate dev` 성공 |
| TASK 3 | Common layer (필터/파이프/인터셉터) | 표준 응답 포맷 |
| TASK 4 | Seed scripts (countries, retailers, categories, admin) | `prisma db seed` 성공 |
| TASK 5 | Admin auth (이메일/비번, argon2id, JWT) | `POST /api/admin/v1/auth/login` |
| TASK 6 | Admin products CRUD | 관리자가 상품 1개 등록 |
| TASK 7 | Public products API | `GET /api/v1/products/:id` 조회 |
| TASK 8 | E2E 스모크 테스트 | admin login → create → public get |

**M1 제외 항목:** admin refresh token, badge_types/뱃지, 카카오 OAuth, 리뷰, 홈, 검색

### M2: Auth + 리뷰 (Week 2)

**목표:** "유저가 카카오 로그인 → 리뷰 작성 → 첫 리뷰어 뱃지 획득"

- 카카오 OAuth + JWT (access + refresh)
- 닉네임 자동 생성 + 중복 회피
- 리뷰 작성 (트랜잭션 + aggregate + 뱃지)
- 리뷰 수정/삭제
- 좋아요, 즐겨찾기, 신고
- 유저 프로필/내 리뷰/내 뱃지
- badge_types seed + 뱃지 부여 로직
- Admin refresh token

### M3: 홈 + 검색 + 관리자 확장 (Week 3)

**목표:** "홈 화면이 편집 홈으로 동작하고, 검색이 가능하다"

- 홈 API (resolver 패턴)
- 검색 API (pg_trgm)
- Admin retailer-products CRUD
- Admin review moderation
- Admin product merge (수동)
- Admin home-sections CRUD
- Admin dashboard stats + action items

### M4: 마무리 (Week 4)

- 분석 이벤트 수집 API
- 알림 (in-app)
- Swagger 문서
- 시드 데이터 200~300개
- Railway 배포

### M5: Admin 웹 (Week 5+)

- Next.js Admin 웹 최소 버전

### Post-MVP

- Flutter 앱
- 바코드 스캔, 푸시, 이미지 리뷰
- 병합 후보 자동 추천
- 개인화

## 브랜치 전략

마일스톤별 브랜치 사용:
- `M1` — 뼈대 작업
- `M2` — Auth + 리뷰
- `M3` — 홈 + 검색 + 관리자 확장

마일스톤 완료 시 main에 머지.

## 커밋 단위

TASK 1개 = 1 커밋 원칙.
TASK 내에서 의미있는 중간 단계가 있으면 분할 가능.
