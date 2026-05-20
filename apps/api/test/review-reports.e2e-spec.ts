import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('ReviewReports (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: number;
  let productId: number;
  let reviewId: number;
  let countryId: number;
  let brandId: number;
  let categoryId: number;

  const uniqueSuffix = Math.random().toString(36).substring(2, 8);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Get existing KR country
    let country = await prisma.country.findUnique({
      where: { code: 'KR' },
    });

    if (!country) {
      country = await prisma.country.create({
        data: {
          code: 'KR',
          nameKo: '한국',
          nameEn: 'South Korea',
          currencyCode: 'KRW',
          languageCode: 'ko-KR',
        },
      });
    }
    countryId = country.id;

    const brand = await prisma.brand.create({
      data: {
        name: '빙그레',
        slug: `binggrae-${uniqueSuffix}`,
      },
    });
    brandId = brand.id;

    const category = await prisma.category.create({
      data: {
        countryId: country.id,
        name: '음료',
        slug: `beverages-${uniqueSuffix}`,
      },
    });
    categoryId = category.id;

    const product = await prisma.product.create({
      data: {
        countryId: country.id,
        brandId: brand.id,
        categoryId: category.id,
        name: '메로나',
        normalizedName: `merona-${uniqueSuffix}`,
        status: 'active',
      },
    });
    productId = product.id;

    const user = await prisma.user.create({
      data: {
        email: `test-${uniqueSuffix}@example.com`,
        nickname: `테스터-${uniqueSuffix}`,
        passwordHash: 'hashedpassword',
        countryId: country.id,
        status: 'active',
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

    // Create access token manually (simple approach for testing)
    const jwt = require('jsonwebtoken');
    authToken = jwt.sign(
      { sub: userId, nickname: `테스터-${uniqueSuffix}`, role: 'user' },
      'dev-user-jwt-secret-change-in-production',
      { expiresIn: '30m' },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/products/:productId/reviews/:reviewId/reports', () => {
    it('should create a report and increment reportedCount', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/products/${productId}/reviews/${reviewId}/reports`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'spam',
          description: 'This is spam content',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.reviewId).toBe(reviewId);
      expect(response.body.data.reporterUserId).toBe(userId);
      expect(response.body.data.reason).toBe('spam');

      // Check reportedCount incremented
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
      });
      expect(review).not.toBeNull();
      expect(review!.reportedCount).toBe(1);
    });

    it('should return 409 when trying to report again', async () => {
      await request(app.getHttpServer())
        .post(`/v1/products/${productId}/reviews/${reviewId}/reports`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'spam',
          description: 'This is spam content',
        })
        .expect(409);
    });

    it('should return 400 when reason is missing', async () => {
      await request(app.getHttpServer())
        .post(`/v1/products/${productId}/reviews/${reviewId}/reports`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'This is spam content',
        })
        .expect(400);
    });

    it('should return 404 when product does not exist', async () => {
      await request(app.getHttpServer())
        .post('/v1/products/99999/reviews/1/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'spam',
        })
        .expect(404);
    });

    it('should return 404 when review does not exist', async () => {
      await request(app.getHttpServer())
        .post(`/v1/products/${productId}/reviews/99999/reports`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'spam',
        })
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post(`/v1/products/${productId}/reviews/${reviewId}/reports`)
        .send({
          reason: 'spam',
        })
        .expect(401);
    });
  });

  describe('Transaction integrity', () => {
    it('should handle report operations correctly', async () => {
      // Create a separate product for this test
      const newProduct = await prisma.product.create({
        data: {
          countryId: countryId,
          brandId: brandId,
          categoryId: categoryId,
          name: '바밤바',
          normalizedName: `bambah-${uniqueSuffix}-2`,
          status: 'active',
        },
      });
      
      // Create a new review to test
      const newReview = await prisma.review.create({
        data: {
          userId,
          productId: newProduct.id,
          rating: 4,
          body: 'Another review',
          moderationStatus: 'visible',
        },
      });
      const newReviewId = newReview.id;

      // Report
      await request(app.getHttpServer())
        .post(`/v1/products/${newProduct.id}/reviews/${newReviewId}/reports`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'inappropriate',
          description: 'Inappropriate content',
        })
        .expect(201);

      let review = await prisma.review.findUnique({
        where: { id: newReviewId },
      });
      expect(review).not.toBeNull();
      expect(review!.reportedCount).toBe(1);
    });
  });
});