import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter, TransformInterceptor } from '../src/common';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Admin Auth Flow (login → refresh → logout)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let refreshToken: string;

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
    await app.close();
  });

  it('POST /api/admin/v1/auth/login with valid credentials returns tokens', async () => {
    const email = process.env.ADMIN_EMAIL ?? 'admin@cartpick.app';
    const password = process.env.ADMIN_PASSWORD ?? 'changeme123!';

    const res = await request(app.getHttpServer())
      .post('/api/admin/v1/auth/login')
      .send({ email, password })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.admin).toBeDefined();
    expect(res.body.data.tokens).toBeDefined();
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();

    accessToken = res.body.data.tokens.accessToken;
    refreshToken = res.body.data.tokens.refreshToken;
  });

  it('POST /api/admin/v1/auth/login with wrong email returns 401', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/v1/auth/login')
      .send({ email: 'wrong@example.com', password: 'changeme123!' })
      .expect(401);
  });

  it('POST /api/admin/v1/auth/login with wrong password returns 401', async () => {
    const email = process.env.ADMIN_EMAIL ?? 'admin@cartpick.app';
    await request(app.getHttpServer())
      .post('/api/admin/v1/auth/login')
      .send({ email, password: 'wrongpassword' })
      .expect(401);
  });

  it('POST /api/admin/v1/auth/refresh with valid token returns new tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/admin/v1/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.refreshToken).not.toBe(refreshToken); // Should be a new token

    // Update tokens for subsequent tests
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('POST /api/admin/v1/auth/refresh with invalid token returns 401', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/v1/auth/refresh')
      .send({ refreshToken: 'this-is-an-invalid-refresh-token-12345' })
      .expect(401);
  });

  it('POST /api/admin/v1/auth/logout revokes the refresh token', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/v1/auth/logout')
      .send({ refreshToken })
      .expect(204);

    // Try to use the revoked token
    await request(app.getHttpServer())
      .post('/api/admin/v1/auth/refresh')
      .send({ refreshToken })
      .expect(401);
  });
});