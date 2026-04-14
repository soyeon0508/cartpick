import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter, TransformInterceptor } from '../src/common';
import { PrismaService } from '../src/prisma/prisma.service';

describe('M1 smoke flow (admin login → create → public get)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let createdProductId: number;

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
  });

  afterAll(async () => {
    if (createdProductId) {
      await prisma.product.deleteMany({ where: { id: createdProductId } });
    }
    await app.close();
  });

  it('GET /api/health returns ok', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });

  it('POST /api/admin/v1/auth/login with seeded admin returns JWT', async () => {
    const email = process.env.ADMIN_EMAIL ?? 'admin@cartpick.app';
    const password = process.env.ADMIN_PASSWORD ?? 'changeme123!';

    const res = await request(app.getHttpServer())
      .post('/api/admin/v1/auth/login')
      .send({ email, password })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.admin.email).toBe(email);

    accessToken = res.body.data.accessToken;
  });

  it('POST /api/admin/v1/auth/login with wrong password returns 401', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/v1/auth/login')
      .send({ email: 'admin@cartpick.app', password: 'wrongpassword' })
      .expect(401);
  });

  it('GET /api/admin/v1/products without token returns 401', async () => {
    await request(app.getHttpServer()).get('/api/admin/v1/products').expect(401);
  });

  it('POST /api/admin/v1/products creates an active product', async () => {
    const [country, category, brand] = await Promise.all([
      prisma.country.findUnique({ where: { code: 'KR' } }),
      prisma.category.findUnique({ where: { slug: 'gummy' } }),
      prisma.brand.findUnique({ where: { slug: 'haribo' } }),
    ]);

    expect(country).toBeTruthy();
    expect(category).toBeTruthy();
    expect(brand).toBeTruthy();

    const res = await request(app.getHttpServer())
      .post('/api/admin/v1/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        countryId: country!.id,
        brandId: brand!.id,
        categoryId: category!.id,
        name: '하리보 골드베렌 100g [smoke]',
        normalizedName: '하리보 골드베렌 smoke',
        volumeValue: '100',
        volumeUnit: 'g',
        packageType: 'bag',
        status: 'active',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.brand.slug).toBe('haribo');

    createdProductId = res.body.data.id;
  });

  it('GET /api/v1/products/:id (public) returns the created product', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/products/${createdProductId}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdProductId);
    expect(res.body.data.name).toContain('하리보');
    expect(res.body.data.volume).toBe('100g');
    expect(res.body.data.brand.name).toBe('하리보');
    expect(res.body.data.category.slug).toBe('gummy');
    expect(res.body.data.retailers).toEqual([]);
  });

  it('GET /api/v1/products/:id for non-existent product returns 404', async () => {
    await request(app.getHttpServer()).get('/api/v1/products/99999999').expect(404);
  });
});
