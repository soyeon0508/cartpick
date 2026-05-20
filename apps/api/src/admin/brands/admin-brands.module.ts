import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../auth/admin-auth.module';
import { AdminBrandsController } from './admin-brands.controller';
import { AdminBrandsService } from './admin-brands.service';

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminBrandsController],
  providers: [AdminBrandsService],
})
export class AdminBrandsModule {}
