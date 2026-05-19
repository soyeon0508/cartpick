import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter, TransformInterceptor } from '../src/common';
import { PrismaService } from '../src/prisma/prisma.service';

describe('User Auth Flow (signup → login → me → refresh)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: number;
  let accessToken: string;
  let refreshToken: string;

  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'testPassword123!',
    nickname: `테스터${Date.now()}`,
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
  });

  afterAll(async () => {
    if (userId) {
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    await app.close();
  });

  it('POST /api/v1/auth/signup creates a new user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send(testUser)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.user.nickname).toBe(testUser.nickname);
    expect(res.body.data.user.status).toBe('active');
    expect(res.body.data.tokens).toBeDefined();
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();
    expect(res.body.data.tokens.accessExpiresIn).toBeDefined();
    expect(res.body.data.tokens.refreshExpiresAt).toBeDefined();

    userId = res.body.data.user.id;
    accessToken = res.body.data.tokens.accessToken;
    refreshToken = res.body.data.tokens.refreshToken;
  });

  it('POST /api/v1/auth/signup with duplicate email returns 409', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        ...testUser,
        nickname: 'differentNickname',
      })
      .expect(409);
  });

  it('POST /api/v1/auth/signup with duplicate nickname returns 409', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        ...testUser,
        email: 'different@example.com',
      })
      .expect(409);
  });

  it('POST /api/v1/auth/signup with invalid email returns 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        ...testUser,
        email: 'invalid-email',
        nickname: 'newNickname',
      })
      .expect(400);
  });

  it('POST /api/v1/auth/signup with short password returns 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        email: 'new@example.com',
        password: 'short',
        nickname: 'newNickname',
      })
      .expect(400);
  });

  it('POST /api/v1/auth/login with valid credentials returns tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.tokens).toBeDefined();
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();

    // Update tokens for subsequent tests
    accessToken = res.body.data.tokens.accessToken;
    refreshToken = res.body.data.tokens.refreshToken;
  });

  it('POST /api/v1/auth/login with wrong email returns 401', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'wrong@example.com',
        password: testUser.password,
      })
      .expect(401);
  });

  it('POST /api/v1/auth/login with wrong password returns 401', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword',
      })
      .expect(401);
  });

  it('GET /api/v1/auth/me with valid token returns user info', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBe(userId);
    expect(res.body.data.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.nickname).toBe(testUser.nickname);
    expect(res.body.data.status).toBe('active');
  });

  it('GET /api/v1/auth/me without token returns 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
  });

  it('GET /api/v1/auth/me with invalid token returns 401', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('POST /api/v1/auth/refresh with valid token returns new tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.refreshToken).not.toBe(refreshToken); // Should be a new token

    // Update tokens for subsequent tests
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('POST /api/v1/auth/refresh with invalid token returns 401', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'this-is-an-invalid-refresh-token-12345' })
      .expect(401);
  });

  it('POST /api/v1/auth/logout revokes the refresh token', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .send({ refreshToken })
      .expect(204);

    // Try to use the revoked token
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(401);
  });

  it('POST /api/v1/auth/login again to get fresh tokens for logout-all test', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    accessToken = res.body.data.tokens.accessToken;
    refreshToken = res.body.data.tokens.refreshToken;
  });

  it('POST /api/v1/auth/logout-all revokes all refresh tokens', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/logout-all')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    // The refresh token should now be invalid
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(401);
  });
});