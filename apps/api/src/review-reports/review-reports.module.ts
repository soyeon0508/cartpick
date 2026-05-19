import { Module } from '@nestjs/common';
import { ReviewReportsService } from './review-reports.service';
import { ReviewReportsController } from './review-reports.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReviewReportsController],
  providers: [ReviewReportsService],
  exports: [ReviewReportsService],
})
export class ReviewReportsModule {}