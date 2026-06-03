import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health.controller';
import { AdminAuthModule } from './admin/auth/admin-auth.module';
import { AdminProductsModule } from './admin/products/admin-products.module';
import { AdminBrandsModule } from './admin/brands/admin-brands.module';
import { AdminCategoriesModule } from './admin/categories/admin-categories.module';
import { AdminRetailersModule } from './admin/retailers/admin-retailers.module';
import { AdminReportsModule } from './admin/reports/admin-reports.module';
import { AdminDashboardModule } from './admin/dashboard/admin-dashboard.module';
import { AdminRetailerProductsModule } from './admin/retailer-products/admin-retailer-products.module';
import { PublicProductsModule } from './public/products/public-products.module';
import { PublicHomeModule } from './public/home/home.module';
import { UserAuthModule } from './user/auth/user-auth.module';
import { UserReviewsModule } from './user/reviews/user-reviews.module';
import { ReviewLikesModule } from './review-likes/review-likes.module';
import { ProductBookmarksModule } from './user/bookmarks/product-bookmarks.module';
import { ReviewReportsModule } from './review-reports/review-reports.module';
import { UserProfileModule } from './user/profile/user-profile.module';
import { UserMeModule } from './user/me/user-me.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AdminAuthModule,
    AdminProductsModule,
    AdminBrandsModule,
    AdminCategoriesModule,
    AdminRetailersModule,
    AdminReportsModule,
    AdminDashboardModule,
    AdminRetailerProductsModule,
    PublicProductsModule,
    PublicHomeModule,
    UserAuthModule,
    UserReviewsModule,
    ReviewLikesModule,
    ProductBookmarksModule,
    ReviewReportsModule,
    UserProfileModule,
    UserMeModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}