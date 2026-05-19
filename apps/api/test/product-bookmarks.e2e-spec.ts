import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GlobalExceptionFilter, TransformInterceptor } from '../src/common';

describe('ProductBookmarks (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: number;
  let productId: number;

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
    await prisma.bookmark.deleteMany();
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

    // Signup user and get auth token
    const signupResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        email: 'test@example.com',
        password: 'testPassword123!',
        nickname: '테스터',
      })
      .expect(201);

    userId = signupResponse.body.data.user.id;
    authToken = signupResponse.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    // Clean up (order matters due to foreign key constraints)
    await prisma.bookmark.deleteMany();
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

  describe('POST /api/v1/products/:productId/bookmarks', () => {
    it('should create a bookmark', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/bookmarks`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.userId).toBe(userId);
      expect(response.body.data.productId).toBe(productId);
    });

    it('should return 409 when trying to bookmark again', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/bookmarks`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(409);
    });

    it('should return 404 when product does not exist', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/products/99999/bookmarks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/bookmarks`)
        .expect(401);
    });
  });

  describe('DELETE /api/v1/products/:productId/bookmarks', () => {
    it('should delete a bookmark', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/products/${productId}/bookmarks`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('should return 404 when trying to delete a non-existent bookmark', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/products/${productId}/bookmarks`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 when product does not exist', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/products/99999/bookmarks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/products/${productId}/bookmarks`)
        .expect(401);
    });
  });

  describe('GET /api/v1/users/bookmarks', () => {
    beforeEach(async () => {
      // Create bookmark for tests
      await prisma.bookmark.create({
        data: {
          userId,
          productId,
        },
      });
    });

    afterEach(async () => {
      await prisma.bookmark.deleteMany();
    });

    it('should return list of bookmarks', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/bookmarks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('bookmarks');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
      expect(response.body.data.bookmarks).toHaveLength(1);
      expect(response.body.data.bookmarks[0].productId).toBe(productId);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/bookmarks')
        .expect(401);
    });

    it('should paginate results', async () => {
      // Create additional products and bookmarks
      for (let i = 0; i < 5; i++) {
        const product = await prisma.product.create({
          data: {
            countryId: 1,
            brandId: 1,
            categoryId: 1,
            name: `Product ${i}`,
            normalizedName: `product-${i}`,
            status: 'active',
          },
        });

        await prisma.bookmark.create({
          data: {
            userId,
            productId: product.id,
          },
        });
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/users/bookmarks?page=1&limit=3')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.bookmarks).toHaveLength(3);
      expect(response.body.data.total).toBe(6);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(3);
    });

    it('should sort by createdAt descending', async () => {
      // Create additional products with different timestamps
      await prisma.bookmark.create({
        data: {
          userId,
          productId: 1,
          createdAt: new Date(Date.now() - 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/users/bookmarks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const timestamps = response.body.data.bookmarks.map((b: any) =>
        new Date(b.createdAt).getTime(),
      );
      expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a));
    });
  });

  describe('Transaction integrity', () => {
    it('should handle bookmark/unbookmark operations correctly', async () => {
      // Bookmark
      await request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/bookmarks`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      let bookmark = await prisma.bookmark.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });
      expect(bookmark).not.toBeNull();

      // Unbookmark
      await request(app.getHttpServer())
        .delete(`/api/v1/products/${productId}/bookmarks`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      bookmark = await prisma.bookmark.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });
      expect(bookmark).toBeNull();
    });
  });
});