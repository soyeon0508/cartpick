import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter, TransformInterceptor } from '../src/common';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Review Rate Limit (3 requests per minute)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: number;
  let retailerId: number;
  let categoryId: number;
  let brandId: number;
  let productIds: number[] = [];

  const testUser = {
    email: `ratelimit-${Date.now()}@example.com`,
    password: 'testPassword123!',
    nickname: `테스터${Date.now()}`,
  };

  const reviewData = {
    rating: 5,
    body: '맛있어요',
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
      throw new Error('Seed country KR is required for rate limit tests');
    }

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

    // Create multiple test products (each user can only review a product once)
    for (let i = 0; i < 6; i++) {
      const product = await prisma.product.create({
        data: {
          countryId: country.id,
          brandId: brand.id,
          categoryId: category.id,
          name: `메로나${i}`,
          normalizedName: `메로나${i}`,
          status: 'active',
        },
      });
      productIds.push(product.id);

      // Create retailer-product connection
      await prisma.retailerProduct.create({
        data: {
          retailerId,
          productId: product.id,
        },
      });
    }

    // Create access token manually (simple approach for testing)
    const jwt = require('jsonwebtoken');
    accessToken = jwt.sign(
      { sub: userId, nickname: testUser.nickname, role: 'user' },
      'dev-user-jwt-secret-change-in-production',
      { expiresIn: '30m' },
    );
  });

  afterAll(async () => {
    // Clean up in order (userBadge must be deleted before user)
    await prisma.userBadge.deleteMany({ where: { userId } });
    await prisma.reviewLike.deleteMany({ where: { userId } });
    await prisma.review.deleteMany({ where: { userId } });
    await prisma.retailerProduct.deleteMany({ where: { productId: { in: productIds } } });
    await prisma.product.deleteMany({ where: { id: { in: productIds } } });
    await prisma.retailer.deleteMany({ where: { id: retailerId } });
    await prisma.category.deleteMany({ where: { id: categoryId } });
    await prisma.brand.deleteMany({ where: { id: brandId } });
    await prisma.refreshToken.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await app.close();
  });

  it('should allow 3 review creations in a minute', async () => {
    // First request
    await request(app.getHttpServer())
      .post(`/api/v1/products/${productIds[0]}/reviews`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ...reviewData, retailerId })
      .expect(201);

    // Second request
    await request(app.getHttpServer())
      .post(`/api/v1/products/${productIds[1]}/reviews`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ...reviewData, retailerId })
      .expect(201);

    // Third request
    await request(app.getHttpServer())
      .post(`/api/v1/products/${productIds[2]}/reviews`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ...reviewData, retailerId })
      .expect(201);
  });

  it('should reject 4th request with 429', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/products/${productIds[3]}/reviews`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ...reviewData, retailerId })
      .expect(429);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('TOO_MANY_REQUESTS');
    expect(res.body.error.message).toContain('Too many review requests');
  });

  it('should allow requests again after time window expires', async () => {
    // Wait for 61 seconds to ensure time window expires
    await new Promise((resolve) => setTimeout(resolve, 61000));

    // Should work again
    await request(app.getHttpServer())
      .post(`/api/v1/products/${productIds[4]}/reviews`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ...reviewData, retailerId })
      .expect(201);
  }, 70000);

  it('should not rate limit unauthenticated requests (handled by UserJwtGuard)', async () => {
    // Unauthenticated request should fail with 401, not 429
    await request(app.getHttpServer())
      .post(`/api/v1/products/${productIds[5]}/reviews`)
      .send(reviewData)
      .expect(401);
  });
});