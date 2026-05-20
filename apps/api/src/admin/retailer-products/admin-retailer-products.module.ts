import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../auth/admin-auth.module';
import { AdminRetailerProductsController } from './admin-retailer-products.controller';
import { AdminRetailerProductsService } from './admin-retailer-products.service';

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminRetailerProductsController],
  providers: [AdminRetailerProductsService],
})
export class AdminRetailerProductsModule {}
