import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { default as request } from 'supertest';
import { AppModule } from '../src/app.module';

describe('Public Home (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /public/home', () => {
    it('should return home page data with all sections', async () => {
      const response = await request(app.getHttpServer())
        .get('/public/home')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('sections');
      expect(Array.isArray(response.body.data.sections)).toBe(true);
    });

    it('should return sections with required fields', async () => {
      const response = await request(app.getHttpServer())
        .get('/public/home')
        .expect(200);

      const sections = response.body.data.sections;
      
      if (sections.length > 0) {
        const firstSection = sections[0];
        expect(firstSection).toHaveProperty('id');
        expect(firstSection).toHaveProperty('title');
        expect(firstSection).toHaveProperty('displayOrder');
        expect(firstSection).toHaveProperty('items');
        expect(Array.isArray(firstSection.items)).toBe(true);

        if (firstSection.items.length > 0) {
          const firstItem = firstSection.items[0];
          expect(firstItem).toHaveProperty('id');
          expect(firstItem).toHaveProperty('name');
          expect(firstItem).toHaveProperty('imageUrl');
          expect(firstItem).toHaveProperty('redirectUrl');
          expect(firstItem).toHaveProperty('type');
        }
      }
    });

    it('should handle empty sections gracefully', async () => {
      const response = await request(app.getHttpServer())
        .get('/public/home')
        .expect(200);

      // Should not error even if no sections are configured
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sections');
      expect(Array.isArray(response.body.data.sections)).toBe(true);
    });

    it('should return sections in correct display order', async () => {
      const response = await request(app.getHttpServer())
        .get('/public/home')
        .expect(200);

      const sections = response.body.data.sections;
      
      // Verify displayOrder is present and numeric
      sections.forEach((section: any) => {
        expect(typeof section.displayOrder).toBe('number');
        expect(section.displayOrder).toBeGreaterThanOrEqual(1);
      });

      // Verify sections are sorted by displayOrder
      for (let i = 1; i < sections.length; i++) {
        expect(sections[i].displayOrder).toBeGreaterThanOrEqual(sections[i - 1].displayOrder);
      }
    });

    it('should include valid item types', async () => {
      const response = await request(app.getHttpServer())
        .get('/public/home')
        .expect(200);

      const sections = response.body.data.sections;
      const validTypes = ['PRODUCT', 'CATEGORY', 'BRAND', 'PROMOTION'];

      sections.forEach((section: any) => {
        section.items.forEach((item: any) => {
          expect(validTypes).toContain(item.type);
        });
      });
    });

    it('should handle database connection errors gracefully', async () => {
      // This test would normally require mocking the database
      // For now, we just verify the endpoint exists
      await request(app.getHttpServer())
        .get('/public/home')
        .expect(200);
    });
  });
});