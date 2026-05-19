import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GlobalExceptionFilter, TransformInterceptor } from '../src/common';
import * as argon2 from 'argon2';

describe('ReviewReports (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: number;
  let productId: number;
  let reviewId: number;

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

    // Clean up database (order matters due to foreign key constraints)
    await prisma.reviewReport.deleteMany();
    await prisma.review.deleteMany();
    await prisma.product.deleteMany();
    await prisma.userBadge.deleteMany();
    await prisma.user.deleteMany();
    await prisma.retailer.deleteMany();
    await prisma.brand.deleteMany();
    await prisma.category.deleteMany();
    await prisma.country.deleteMany();

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

    const brand = await prisma.brand.create({
      data: {
        name: '빙그레',
        slug: 'binggrae',
      },
    });

    const category = await prisma.category.create({
      data: {
        countryId: country.id,
        name: '음료',
        slug: 'beverages',
      },
    });

    const product = await prisma.product.create({
      data: {
        countryId: country.id,
        brandId: brand.id,
        categoryId: category.id,
        name: '메로나',
        normalizedName: 'merona',
        status: 'active',
      },
    });
    productId = product.id;

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

    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating: 5,
        body: '맛있어요',
        moderationStatus: 'visible',
      },
    });
    reviewId = review.id;

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
    // Clean up (order matters due to foreign key constraints)
    await prisma.reviewReport.deleteMany();
    await prisma.review.deleteMany();
    await prisma.product.deleteMany();
    await prisma.userBadge.deleteMany();
    await prisma.user.deleteMany();
    await prisma.retailer.deleteMany();
    await prisma.brand.deleteMany();
    await prisma.category.deleteMany();
    await prisma.country.deleteMany();

    await app.close();
  });

  beforeEach(async () => {
    // Clean up reports before each test
    await prisma.reviewReport.deleteMany();
    
    // Reset review counters
    await prisma.review.update({
      where: { id: reviewId },
      data: { reportedCount: 0, moderationStatus: 'visible' },
    });
  });

  describe('POST /api/v1/products/:productId/reviews/:reviewId/reports', () => {
    it('should create a report and increment reportedCount', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/reviews/${reviewId}/reports`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'inappropriate',
          description: 'This review contains inappropriate content',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.reason).toBe('inappropriate');
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.reporterUserId).toBe(userId);
      expect(response.body.data.reviewId).toBe(reviewId);

      // Check reportedCount incremented
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
      });
      expect(review).not.toBeNull();
      expect(review!.reportedCount).toBe(1);
    });

    it('should return 409 when trying to report the same review twice', async () => {
      // First report
      await request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/reviews/${reviewId}/reports`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'spam',
        })
        .expect(201);

      // Second report should fail
      await request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/reviews/${reviewId}/reports`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'inappropriate',
        })
        .expect(409);
    });

    it('should return 404 when review does not exist', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/reviews/99999/reports`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'inappropriate',
        })
        .expect(404);
    });

    it('should return 404 when product does not exist', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/products/99999/reviews/1/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'inappropriate',
        })
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/reviews/${reviewId}/reports`)
        .send({
          reason: 'inappropriate',
        })
        .expect(401);
    });

    it('should return 400 for invalid reason', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/reviews/${reviewId}/reports`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'invalid_reason',
        })
        .expect(400);
    });

    it('should accept all valid reasons', async () => {
      const validReasons = ['spam', 'inappropriate', 'misleading', 'offensive'];

      for (const reason of validReasons) {
        await request(app.getHttpServer())
          .post(`/api/v1/products/${productId}/reviews/${reviewId}/reports`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ reason })
          .expect(201);

        // Reset for next test
        await prisma.reviewReport.deleteMany();
        await prisma.review.update({
          where: { id: reviewId },
          data: { reportedCount: 0 },
        });
      }
    });

    it('should auto-moderate review when reportedCount >= 5', async () => {
      // Get the country ID from the existing review's product
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { countryId: true },
      });

      // Create 4 additional users
      const users = [];
      for (let i = 0; i < 4; i++) {
        const passwordHash = await argon2.hash(`password${i}!`, {
          type: argon2.argon2id,
        });
        const user = await prisma.user.create({
          data: {
            email: `test${i}@example.com`,
            nickname: `테스터${i}`,
            passwordHash,
            countryId: product!.countryId,
          },
        });
        users.push({ ...user, password: `password${i}!` });
      }

      // Create 5 reports (1 from original user + 4 from new users)
      await request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/reviews/${reviewId}/reports`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'spam' })
        .expect(201);

      for (const user of users) {
        const loginResponse = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: user.email,
            password: user.password,
          });
        const token = loginResponse.body.data.tokens.accessToken;

        await request(app.getHttpServer())
          .post(`/api/v1/products/${productId}/reviews/${reviewId}/reports`)
          .set('Authorization', `Bearer ${token}`)
          .send({ reason: 'spam' })
          .expect(201);
      }

      // Check if moderationStatus changed to 'reported'
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
      });
      expect(review).not.toBeNull();
      expect(review!.reportedCount).toBe(5);
      expect(review!.moderationStatus).toBe('reported');
    });

    it('should not auto-moderate when reportedCount < 5', async () => {
      // Get the country ID from the existing review's product
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { countryId: true },
      });

      // Create 2 additional users
      const users = [];
      for (let i = 0; i < 2; i++) {
        const passwordHash = await argon2.hash(`password${i}!`, {
          type: argon2.argon2id,
        });
        const user = await prisma.user.create({
          data: {
            email: `test-nomod${i}@example.com`,
            nickname: `테스터노모드${i}`,
            passwordHash,
            countryId: product!.countryId,
          },
        });
        users.push({ ...user, password: `password${i}!` });
      }

      // Create 3 reports (1 from original user + 2 from new users)
      await request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/reviews/${reviewId}/reports`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'spam' })
        .expect(201);

      for (const user of users) {
        const loginResponse = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: user.email,
            password: user.password,
          });
        const token = loginResponse.body.data.tokens.accessToken;

        await request(app.getHttpServer())
          .post(`/api/v1/products/${productId}/reviews/${reviewId}/reports`)
          .set('Authorization', `Bearer ${token}`)
          .send({ reason: 'spam' })
          .expect(201);
      }

      // Check if moderationStatus did not change
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
      });
      expect(review).not.toBeNull();
      expect(review!.reportedCount).toBe(3);
      expect(review!.moderationStatus).toBe('visible');
    });

    it('should accept optional description', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/reviews/${reviewId}/reports`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'inappropriate',
          description: 'Detailed description of the issue',
        })
        .expect(201);

      expect(response.body.data.description).toBe('Detailed description of the issue');
    });

    it('should work without description', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/reviews/${reviewId}/reports`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'spam',
        })
        .expect(201);

      expect(response.body.data.description).toBeNull();
    });
  });

  describe('Transaction integrity', () => {
    it('should increment reportedCount atomically with report creation', async () => {
      const initialReview = await prisma.review.findUnique({
        where: { id: reviewId },
      });
      const initialCount = initialReview!.reportedCount;

      await request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/reviews/${reviewId}/reports`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'spam',
        })
        .expect(201);

      const updatedReview = await prisma.review.findUnique({
        where: { id: reviewId },
      });

      expect(updatedReview).not.toBeNull();
      expect(updatedReview!.reportedCount).toBe(initialCount + 1);
    });
  });
});