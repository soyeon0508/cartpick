import { Module } from '@nestjs/common';
import { UserReviewsController } from './user-reviews.controller';
import { UserReviewsService } from './user-reviews.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserReviewsController],
  providers: [UserReviewsService],
})
export class UserReviewsModule {}