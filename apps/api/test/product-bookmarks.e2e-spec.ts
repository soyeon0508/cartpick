import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('ProductBookmarks (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: number;
  let productId: number;
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

    // Create access token manually (simple approach for testing)
    const jwt = require('jsonwebtoken');
    authToken = jwt.sign(
      { sub: userId, nickname: `테스터-${uniqueSuffix}`, role: 'user' },
      'dev-user-jwt-secret-change-in-production',
      { expiresIn: '30m' },
    );
  });

  afterAll(async () => {
    // Clean up (order matters due to foreign key constraints)
    await prisma.bookmark.deleteMany({ where: { userId } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.userBadge.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.brand.deleteMany({ where: { id: brandId } });
    await prisma.category.deleteMany({ where: { id: categoryId } });

    await app.close();
  });

  describe('POST /v1/products/:productId/bookmarks', () => {
    it('should create a bookmark', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/products/${productId}/bookmarks`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.userId).toBe(userId);
      expect(response.body.data.productId).toBe(productId);
    });

    it('should return 409 when trying to bookmark again', async () => {
      await request(app.getHttpServer())
        .post(`/v1/products/${productId}/bookmarks`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(409);
    });

    it('should return 404 when product does not exist', async () => {
      await request(app.getHttpServer())
        .post('/v1/products/99999/bookmarks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post(`/v1/products/${productId}/bookmarks`)
        .expect(401);
    });
  });

  describe('GET /v1/users/bookmarks', () => {
    it('should return list of bookmarks', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/users/bookmarks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('bookmarks');
      expect(Array.isArray(response.body.data.bookmarks)).toBe(true);
      expect(response.body.data.bookmarks.length).toBeGreaterThan(0);
      expect(response.body.data.bookmarks[0]).toHaveProperty('id');
      expect(response.body.data.bookmarks[0]).toHaveProperty('product');
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/users/bookmarks?limit=1&page=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.bookmarks)).toBe(true);
      expect(response.body.data.bookmarks.length).toBeLessThanOrEqual(1);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer()).get('/v1/users/bookmarks').expect(401);
    });
  });

  describe('DELETE /v1/products/:productId/bookmarks', () => {
    it('should delete a bookmark', async () => {
      await request(app.getHttpServer())
        .delete(`/v1/products/${productId}/bookmarks`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify bookmark is deleted
      const response = await request(app.getHttpServer())
        .get('/v1/users/bookmarks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.bookmarks.length).toBe(0);
    });

    it('should return 404 when trying to delete a non-existent bookmark', async () => {
      await request(app.getHttpServer())
        .delete(`/v1/products/${productId}/bookmarks`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .delete(`/v1/products/${productId}/bookmarks`)
        .expect(401);
    });
  });

  describe('Transaction integrity', () => {
    it('should handle bookmark/delete operations correctly', async () => {
      // Bookmark
      await request(app.getHttpServer())
        .post(`/v1/products/${productId}/bookmarks`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      let response = await request(app.getHttpServer())
        .get('/v1/users/bookmarks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.bookmarks.length).toBe(1);

      // Delete
      await request(app.getHttpServer())
        .delete(`/v1/products/${productId}/bookmarks`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      response = await request(app.getHttpServer())
        .get('/v1/users/bookmarks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.bookmarks.length).toBe(0);
    });
  });
});