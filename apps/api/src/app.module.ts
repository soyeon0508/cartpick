import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health.controller';
import { AdminAuthModule } from './admin/auth/admin-auth.module';
import { AdminProductsModule } from './admin/products/admin-products.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AdminAuthModule,
    AdminProductsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
