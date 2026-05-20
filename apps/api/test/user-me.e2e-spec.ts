import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GlobalExceptionFilter, TransformInterceptor } from '../src/common';

describe('UserMe (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: number;
  let otherUserId: number;
  let product1Id: number;
  let product2Id: number;
  let brandId: number;
  let categoryId: number;
  const suffix = Date.now();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Use seeded country
    const country = await prisma.country.findUnique({ where: { code: 'KR' } });
    if (!country) throw new Error('Seed country KR is required');

    // Create test users via signup
    const signupRes = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        email: `me-test-${suffix}@example.com`,
        password: 'testPassword123!',
        nickname: `미테스터${suffix}`,
      });
    userId = signupRes.body.data.user.id;
    authToken = signupRes.body.data.tokens.accessToken;

    const otherSignupRes = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        email: `me-other-${suffix}@example.com`,
        password: 'testPassword123!',
        nickname: `다른사용자${suffix}`,
      });
    otherUserId = otherSignupRes.body.data.user.id;

    // Create brand + category
    const brand = await prisma.brand.create({
      data: { name: `미브랜드${suffix}`, slug: `me-brand-${suffix}` },
    });
    brandId = brand.id;

    const category = await prisma.category.create({
      data: { name: `미카테고리${suffix}`, slug: `me-cat-${suffix}`, countryId: country.id },
    });
    categoryId = category.id;

    // Create products
    const product1 = await prisma.product.create({
      data: {
        name: `미상품1-${suffix}`,
        normalizedName: `미상품1-${suffix}`,
        brandId: brand.id,
        categoryId: category.id,
        countryId: country.id,
        status: 'active',
      },
    });
    product1Id = product1.id;

    const product2 = await prisma.product.create({
      data: {
        name: `미상품2-${suffix}`,
        normalizedName: `미상품2-${suffix}`,
        brandId: brand.id,
        categoryId: category.id,
        countryId: country.id,
        status: 'active',
      },
    });
    product2Id = product2.id;

    // Create reviews for main user
    await prisma.review.create({
      data: { userId, productId: product1Id, rating: 5, body: '리뷰1' },
    });
    await prisma.review.create({
      data: { userId, productId: product2Id, rating: 4, body: '리뷰2' },
    });

    // Create bookmarks
    await prisma.bookmark.create({ data: { userId, productId: product1Id } });
    await prisma.bookmark.create({ data: { userId, productId: product2Id } });

    // Create review by other user + like it
    const otherReview = await prisma.review.create({
      data: { userId: otherUserId, productId: product1Id, rating: 3, body: '다른유저리뷰' },
    });
    await prisma.reviewLike.create({ data: { userId, reviewId: otherReview.id } });
  });

  afterAll(async () => {
    await prisma.reviewLike.deleteMany({ where: { userId } });
    await prisma.bookmark.deleteMany({ where: { userId } });
    await prisma.review.deleteMany({ where: { userId } });
    await prisma.review.deleteMany({ where: { userId: otherUserId } });
    await prisma.product.deleteMany({ where: { id: { in: [product1Id, product2Id] } } });
    await prisma.brand.deleteMany({ where: { id: brandId } });
    await prisma.category.deleteMany({ where: { id: categoryId } });
    await prisma.refreshToken.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
    await prisma.userBadge.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
    await app.close();
  });

  describe('GET /api/v1/users/me', () => {
    it('should return user information with statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', userId);
      expect(response.body.data).toHaveProperty('email', `me-test-${suffix}@example.com`);
      expect(response.body.data).toHaveProperty('status', 'active');
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).not.toHaveProperty('passwordHash');
      expect(response.body.data.stats).toHaveProperty('totalReviews', 2);
      expect(response.body.data.stats).toHaveProperty('totalBookmarks', 2);
      expect(response.body.data.stats).toHaveProperty('totalLikes', 1);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .expect(401);
    });

    it('should return correct stats for user with no activity', async () => {
      const noActivitySignup = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: `me-noact-${suffix}@example.com`,
          password: 'testPassword123!',
          nickname: `빈유저${suffix}`,
        });

      const noActivityToken = noActivitySignup.body.data.tokens.accessToken;
      const noActivityUserId = noActivitySignup.body.data.user.id;

      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${noActivityToken}`)
        .expect(200);

      expect(response.body.data.stats).toHaveProperty('totalReviews', 0);
      expect(response.body.data.stats).toHaveProperty('totalBookmarks', 0);
      expect(response.body.data.stats).toHaveProperty('totalLikes', 0);

      // Clean up
      await prisma.refreshToken.deleteMany({ where: { userId: noActivityUserId } });
      await prisma.user.deleteMany({ where: { id: noActivityUserId } });
    });
  });
});
