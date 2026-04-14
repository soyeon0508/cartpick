import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health.controller';
import { AdminAuthModule } from './admin/auth/admin-auth.module';
import { AdminProductsModule } from './admin/products/admin-products.module';
import { PublicProductsModule } from './public/products/public-products.module';
import { UserAuthModule } from './user/auth/user-auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AdminAuthModule,
    AdminProductsModule,
    PublicProductsModule,
    UserAuthModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
