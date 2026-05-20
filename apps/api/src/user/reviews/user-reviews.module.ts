import { Module } from '@nestjs/common';
import { UserReviewsController } from './user-reviews.controller';
import { UserReviewsService } from './user-reviews.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReviewRateLimitGuard } from '../../common/guards/review-rate-limit.guard';

@Module({
  imports: [PrismaModule],
  controllers: [UserReviewsController],
  providers: [UserReviewsService, ReviewRateLimitGuard],
})
export class UserReviewsModule {}