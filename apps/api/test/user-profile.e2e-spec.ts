import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GlobalExceptionFilter, TransformInterceptor } from '../src/common';
import * as argon2 from 'argon2';

describe('UserProfile (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: number;

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

    // Clean up database
    await prisma.user.deleteMany();
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
    // Clean up
    await prisma.user.deleteMany();
    await prisma.country.deleteMany();

    await app.close();
  });

  describe('GET /api/v1/users/profile', () => {
    it('should return user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email', 'test@example.com');
      expect(response.body.data).toHaveProperty('nickname', '테스터');
      expect(response.body.data).toHaveProperty('countryId');
      expect(response.body.data).toHaveProperty('status', 'active');
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).not.toHaveProperty('password');
      expect(response.body.data).not.toHaveProperty('passwordHash');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .expect(401);
    });
  });

  describe('PATCH /api/v1/users/profile', () => {
    beforeEach(async () => {
      // Reset profile data before each test
      await prisma.user.update({
        where: { id: userId },
        data: {
          nickname: '테스터',
          profileImage: null,
        },
      });
    });

    it('should update nickname', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nickname: '새로운닉네임',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nickname).toBe('새로운닉네임');
      expect(response.body.data.updatedAt).toBeDefined();
    });

    it('should update profile image', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      const response = await request(app.getHttpServer())
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profileImage: imageUrl,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profileImage).toBe(imageUrl);
    });

    it('should update both nickname and profile image', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nickname: '업데이트된닉네임',
          profileImage: 'https://example.com/new-image.jpg',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nickname).toBe('업데이트된닉네임');
      expect(response.body.data.profileImage).toBe('https://example.com/new-image.jpg');
    });

    it('should return 409 when nickname is already taken', async () => {
      // Create another user
      const passwordHash = await argon2.hash('otherPassword123!', {
        type: argon2.argon2id,
      });

      // Get the existing country ID
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { countryId: true },
      });

      await prisma.user.create({
        data: {
          email: 'other@example.com',
          nickname: '중복닉네임',
          passwordHash,
          countryId: existingUser!.countryId,
        },
      });

      // Try to update with duplicate nickname
      await request(app.getHttpServer())
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nickname: '중복닉네임',
        })
        .expect(409);
    });

    it('should allow updating to same nickname', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nickname: '테스터',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nickname).toBe('테스터');
    });

    it('should return 400 for invalid nickname (too short)', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nickname: '',
        })
        .expect(400);
    });

    it('should return 400 for invalid nickname (too long)', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nickname: 'a'.repeat(31),
        })
        .expect(400);
    });

    it('should return 400 for invalid profile image URL', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profileImage: 'not-a-valid-url',
        })
        .expect(400);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/users/profile')
        .send({
          nickname: '새로운닉네임',
        })
        .expect(401);
    });

    it('should accept and convert number to string for nickname', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nickname: 123,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nickname).toBe('123');
    });

    it('should handle null profileImage', async () => {
      // First set a profile image
      await request(app.getHttpServer())
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profileImage: 'https://example.com/image.jpg',
        })
        .expect(200);

      // Then clear it
      const response = await request(app.getHttpServer())
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profileImage: null,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profileImage).toBeNull();
    });
  });
});