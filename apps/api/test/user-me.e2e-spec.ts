import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GlobalExceptionFilter, TransformInterceptor } from '../src/common';
import * as argon2 from 'argon2';

describe('UserMe (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: number;

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

    // Clean up database
    await prisma.user.deleteMany();
    await prisma.country.deleteMany();
    await prisma.product.deleteMany();
    await prisma.review.deleteMany();
    await prisma.bookmark.deleteMany();
    await prisma.reviewLike.deleteMany();

    // Create test data
    const country = await prisma.country.create({
      data: {
        code: 'KR',
        nameKo: '한국',
        nameEn: 'Korea',
        currencyCode: 'KRW',
        languageCode: 'ko-KR',
      },
    });

    const passwordHash = await argon2.hash('testPassword123!', {
      type: argon2.argon2id,
    });

    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        nickname: '테스터',
        passwordHash,
        countryId: country.id,
      },
    });
    userId = user.id;

    // Create products
    const brand = await prisma.brand.create({
      data: {
        name: 'Test Brand',
        nameEn: 'Test Brand',
        slug: 'test-brand',
      },
    });

    const category = await prisma.category.create({
      data: {
        name: 'Test Category',
        countryId: country.id,
        slug: 'test-category',
      },
    });

    const product1 = await prisma.product.create({
      data: {
        name: 'Test Product 1',
        normalizedName: 'test product 1',
        brandId: brand.id,
        categoryId: category.id,
        countryId: country.id,
      },
    });

    const product2 = await prisma.product.create({
      data: {
        name: 'Test Product 2',
        normalizedName: 'test product 2',
        brandId: brand.id,
        categoryId: category.id,
        countryId: country.id,
      },
    });

    // Create reviews
    await prisma.review.create({
      data: {
        userId,
        productId: product1.id,
        rating: 5,
        body: '테스트 리뷰 내용 1',
      },
    });

    await prisma.review.create({
      data: {
        userId,
        productId: product2.id,
        rating: 4,
        body: '테스트 리뷰 내용 2',
      },
    });

    // Create bookmarks
    await prisma.bookmark.create({
      data: {
        userId,
        productId: product1.id,
      },
    });

    await prisma.bookmark.create({
      data: {
        userId,
        productId: product2.id,
      },
    });

    // Create another user and review to like
    const passwordHash2 = await argon2.hash('otherPassword123!', {
      type: argon2.argon2id,
    });

    const otherUser = await prisma.user.create({
      data: {
        email: 'other@example.com',
        nickname: '다른사용자',
        passwordHash: passwordHash2,
        countryId: country.id,
      },
    });

    const otherReview = await prisma.review.create({
      data: {
        userId: otherUser.id,
        productId: product1.id,
        rating: 5,
        body: '다른 사용자가 작성한 리뷰',
      },
    });

    // Like the review
    await prisma.reviewLike.create({
      data: {
        userId,
        reviewId: otherReview.id,
      },
    });

    // Login and get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testPassword123!',
      });

    authToken = loginResponse.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    // Clean up
    await prisma.user.deleteMany();
    await prisma.country.deleteMany();
    await prisma.product.deleteMany();
    await prisma.review.deleteMany();
    await prisma.bookmark.deleteMany();
    await prisma.reviewLike.deleteMany();
    await prisma.brand.deleteMany();
    await prisma.category.deleteMany();

    await app.close();
  });

  describe('GET /api/v1/users/me', () => {
    it('should return user information with statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email', 'test@example.com');
      expect(response.body.data).toHaveProperty('nickname', '테스터');
      expect(response.body.data).toHaveProperty('countryId');
      expect(response.body.data).toHaveProperty('status', 'active');
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data.stats).toHaveProperty('totalReviews', 2);
      expect(response.body.data.stats).toHaveProperty('totalBookmarks', 2);
      expect(response.body.data.stats).toHaveProperty('totalLikes', 1);
      expect(response.body.data).not.toHaveProperty('password');
      expect(response.body.data).not.toHaveProperty('passwordHash');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .expect(401);
    });

    it('should return correct stats for user with no activity', async () => {
      // Create a new user with no activity
      const passwordHash = await argon2.hash('newPassword123!', {
        type: argon2.argon2id,
      });

      const newUser = await prisma.user.create({
        data: {
          email: 'newuser@example.com',
          nickname: '새사용자',
          passwordHash,
          countryId: 1, // Assuming country ID 1 exists
        },
      });

      // Login as new user
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'newuser@example.com',
          password: 'newPassword123!',
        });

      const newAuthToken = loginResponse.body.data.tokens.accessToken;

      // Get me data
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${newAuthToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toHaveProperty('totalReviews', 0);
      expect(response.body.data.stats).toHaveProperty('totalBookmarks', 0);
      expect(response.body.data.stats).toHaveProperty('totalLikes', 0);
    });
  });
});