import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter, TransformInterceptor } from '../src/common';
import { PrismaService } from '../src/prisma/prisma.service';

describe('User Reviews API (create → update → delete)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: number;
  let productId: number;
  let retailerId: number;
  let testCountryId: number;
  let categoryId: number;
  let brandId: number;
  let accessToken: string;

  const testUser = {
    email: `review-test-${Date.now()}@example.com`,
    password: 'testPassword123!',
    nickname: `리뷰테스터${Date.now()}`,
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
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

    prisma = app.get(PrismaService);

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: testUser.email,
        passwordHash: 'hashed-password',
        nickname: testUser.nickname,
        status: 'active',
      },
    });
    userId = user.id;

    const country = await prisma.country.findUnique({
      where: { code: 'KR' },
    });

    if (!country) {
      throw new Error('Seed country KR is required for user review tests');
    }

    testCountryId = country.id;

    // Create test retailer
    const retailer = await prisma.retailer.create({
      data: {
        countryId: country.id,
        name: 'GS25',
        slug: `gs25-${Date.now()}`,
        retailerType: 'convenience_store',
      },
    });
    retailerId = retailer.id;

    // Create test category
    const category = await prisma.category.create({
      data: {
        countryId: country.id,
        name: '음료',
        slug: `beverages-${Date.now()}`,
      },
    });
    categoryId = category.id;

    // Create test brand
    const brand = await prisma.brand.create({
      data: {
        name: '빙그레',
        slug: `binggrae-${Date.now()}`,
      },
    });
    brandId = brand.id;

    // Create test product
    const product = await prisma.product.create({
      data: {
        countryId: country.id,
        brandId: brand.id,
        categoryId: category.id,
        name: '메로나',
        normalizedName: '메로나',
        status: 'active',
      },
    });
    productId = product.id;

    // Create retailer-product connection
    await prisma.retailerProduct.create({
      data: {
        retailerId,
        productId,
      },
    });

    // Create access token manually (simple approach for testing)
    const jwt = require('jsonwebtoken');
    accessToken = jwt.sign(
      { sub: userId, nickname: testUser.nickname, role: 'user' },
      'dev-user-jwt-secret-change-in-production',
      { expiresIn: '30m' },
    );
  });

  afterAll(async () => {
    // Clean up in order
    await prisma.review.deleteMany({ where: { userId } });
    await prisma.retailerProduct.deleteMany({ where: { productId } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.retailer.deleteMany({ where: { id: retailerId } });
    await prisma.category.deleteMany({ where: { id: categoryId } });
    await prisma.brand.deleteMany({ where: { id: brandId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await app.close();
  });

  describe('POST /api/v1/products/:productId/reviews', () => {
    it('creates a review with valid data', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/reviews`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          rating: 5,
          body: '달고 진해서 맛있어요',
          retailerId,
          tagCodes: ['sweet', 'rich', 'repurchase_yes'],
          repurchaseIntent: true,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.rating).toBe(5);
      expect(res.body.data.body).toBe('달고 진해서 맛있어요');
      expect(res.body.data.retailerId).toBe(retailerId);
      expect(res.body.data.tags).toEqual(['sweet', 'rich', 'repurchase_yes']);
      expect(res.body.data.repurchaseIntent).toBe(true);
    });

    it('returns 409 when trying to create duplicate review', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/reviews`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          rating: 4,
          body: '다른 리뷰',
        })
        .expect(409);
    });

    it('returns 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/reviews`)
        .send({
          rating: 5,
        })
        .expect(401);
    });

    it('returns 400 with invalid rating', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/reviews`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          rating: 6, // Invalid: must be 1-5
          body: '리뷰',
        })
        .expect(400);
    });

    it('returns 404 with non-existent product', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/products/99999/reviews')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          rating: 5,
        })
        .expect(404);
    });

    it('returns 400 with invalid product id', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/products/not-a-number/reviews')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          rating: 5,
        })
        .expect(400);
    });

    it('returns 404 with non-existent retailer', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/reviews`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          rating: 5,
          retailerId: 99999,
        })
        .expect(404);
    });

    it('returns 400 with retailer not connected to product', async () => {
      // Create another retailer not connected to the product
      const retailer2 = await prisma.retailer.create({
        data: {
          countryId: testCountryId,
          name: 'CU',
          slug: `cu-${Date.now()}`,
          retailerType: 'convenience_store',
        },
      });

      await request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/reviews`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          rating: 5,
          retailerId: retailer2.id,
        })
        .expect(400);

      // Clean up
      await prisma.retailer.delete({ where: { id: retailer2.id } });
    });

    it('creates review without optional fields', async () => {
      // Create another product for testing
      const product2 = await prisma.product.create({
        data: {
          countryId: testCountryId,
          brandId,
          categoryId,
          name: '바밤바',
          normalizedName: '바밤바',
          status: 'active',
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/products/${product2.id}/reviews`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          rating: 4,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(4);
      expect(res.body.data.body).toBe('');
      expect(res.body.data.tags).toEqual([]);

      // Clean up
      await prisma.review.deleteMany({ where: { productId: product2.id } });
      await prisma.product.delete({ where: { id: product2.id } });
    });

    it('updates product aggregates after create', async () => {
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      expect(product!.reviewCount).toBe(1);
      expect(parseFloat(product!.averageRating.toString())).toBe(5.0);
    });
  });

  describe('PUT /api/v1/products/:productId/reviews/me', () => {
    it('updates an existing review', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/products/${productId}/reviews/me`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          rating: 4,
          body: '다시 먹어보니 조금 달아요',
          retailerId,
          tagCodes: ['sweet'],
          repurchaseIntent: false,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(4);
      expect(res.body.data.body).toBe('다시 먹어보니 조금 달아요');
      expect(res.body.data.tags).toEqual(['sweet']);
      expect(res.body.data.repurchaseIntent).toBe(false);
    });

    it('returns 404 when updating non-existent review', async () => {
      const product3 = await prisma.product.create({
        data: {
          countryId: testCountryId,
          brandId,
          categoryId,
          name: '스크류바',
          normalizedName: '스크류바',
          status: 'active',
        },
      });

      await request(app.getHttpServer())
        .put(`/api/v1/products/${product3.id}/reviews/me`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          rating: 5,
        })
        .expect(404);

      // Clean up
      await prisma.product.delete({ where: { id: product3.id } });
    });

    it('returns 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/products/${productId}/reviews/me`)
        .send({
          rating: 5,
        })
        .expect(401);
    });

    it('replaces tags on update', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/products/${productId}/reviews/me`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          rating: 5,
          tagCodes: ['crunchy', 'creamy'],
        })
        .expect(200);

      expect(res.body.data.tags).toEqual(['crunchy', 'creamy']);
    });

    it('updates product aggregates after update', async () => {
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      expect(product!.reviewCount).toBe(1);
      expect(parseFloat(product!.averageRating.toString())).toBe(5.0);
    });
  });

  describe('DELETE /api/v1/products/:productId/reviews/me', () => {
    it('deletes an existing review', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/products/${productId}/reviews/me`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // Verify review is deleted
      const review = await prisma.review.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });

      expect(review).toBeNull();
    });

    it('returns 404 when deleting non-existent review', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/products/${productId}/reviews/me`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('returns 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/products/${productId}/reviews/me`)
        .expect(401);
    });

    it('resets product aggregates after delete', async () => {
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      expect(product!.reviewCount).toBe(0);
      expect(parseFloat(product!.averageRating.toString())).toBe(0.0);
    });
  });
});
