import { Module } from '@nestjs/common';
import { ReviewLikesService } from './review-likes.service';
import { ReviewLikesController } from './review-likes.controller';

@Module({
  controllers: [ReviewLikesController],
  providers: [ReviewLikesService],
  exports: [ReviewLikesService],
})
export class ReviewLikesModule {}