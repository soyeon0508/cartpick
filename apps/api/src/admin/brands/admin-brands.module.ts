import { Module } from '@nestjs/common';
import { AdminBrandsService } from './admin-brands.service';
import { AdminBrandsController } from './admin-brands.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminBrandsController],
  providers: [AdminBrandsService],
  exports: [AdminBrandsService],
})
export class AdminBrandsModule {}