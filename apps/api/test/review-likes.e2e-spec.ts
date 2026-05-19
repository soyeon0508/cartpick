import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('ReviewLikes (e2e)', () => {
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
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Clean up database (order matters due to foreign key constraints)
    await prisma.reviewLike.deleteMany();
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

    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        nickname: '테스터',
        passwordHash: 'hashedpassword',
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
      .post('/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'hashedpassword',
      });

    authToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    // Clean up (order matters due to foreign key constraints)
    await prisma.reviewLike.deleteMany();
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

  describe('POST /v1/products/:productId/reviews/:reviewId/likes', () => {
    it('should create a like and increment likeCount', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/products/${productId}/reviews/${reviewId}/likes`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.userId).toBe(userId);
      expect(response.body.data.reviewId).toBe(reviewId);

      // Check likeCount incremented
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
      });
      expect(review).not.toBeNull();
      expect(review!.likeCount).toBe(1);
    });

    it('should return 409 when trying to like again', async () => {
      await request(app.getHttpServer())
        .post(`/v1/products/${productId}/reviews/${reviewId}/likes`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(409);
    });

    it('should return 404 when product does not exist', async () => {
      await request(app.getHttpServer())
        .post('/v1/products/99999/reviews/1/likes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 when review does not exist', async () => {
      await request(app.getHttpServer())
        .post(`/v1/products/${productId}/reviews/99999/likes`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post(`/v1/products/${productId}/reviews/${reviewId}/likes`)
        .expect(401);
    });
  });

  describe('DELETE /v1/products/:productId/reviews/:reviewId/likes', () => {
    it('should delete a like and decrement likeCount', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/v1/products/${productId}/reviews/${reviewId}/likes`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      expect(response.body).toEqual({});

      // Check likeCount decremented
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
      });
      expect(review).not.toBeNull();
      expect(review!.likeCount).toBe(0);
    });

    it('should return 404 when trying to unlike a non-existent like', async () => {
      await request(app.getHttpServer())
        .delete(`/v1/products/${productId}/reviews/${reviewId}/likes`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 when product does not exist', async () => {
      await request(app.getHttpServer())
        .delete('/v1/products/99999/reviews/1/likes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 when review does not exist', async () => {
      await request(app.getHttpServer())
        .delete(`/v1/products/${productId}/reviews/99999/likes`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .delete(`/v1/products/${productId}/reviews/${reviewId}/likes`)
        .expect(401);
    });
  });

  describe('Transaction integrity', () => {
    it('should handle like/unlike operations correctly', async () => {
      // Like
      await request(app.getHttpServer())
        .post(`/v1/products/${productId}/reviews/${reviewId}/likes`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      let review = await prisma.review.findUnique({
        where: { id: reviewId },
      });
      expect(review).not.toBeNull();
      expect(review!.likeCount).toBe(1);

      // Unlike
      await request(app.getHttpServer())
        .delete(`/v1/products/${productId}/reviews/${reviewId}/likes`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      review = await prisma.review.findUnique({
        where: { id: reviewId },
      });
      expect(review).not.toBeNull();
      expect(review!.likeCount).toBe(0);
    });
  });
});