import {
  Controller,
  Post,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReviewLikesService } from './review-likes.service';
import { UserJwtGuard } from '../user/auth/guards/user-jwt.guard';
import { CurrentUser } from '../user/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../user/auth/strategies/user-jwt.strategy';

@Controller('v1/products/:productId/reviews/:reviewId/likes')
export class ReviewLikesController {
  constructor(private readonly reviewLikesService: ReviewLikesService) {}

  @Post()
  @UseGuards(UserJwtGuard)
  async like(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const like = await this.reviewLikesService.likeReview(
      user.id,
      productId,
      reviewId,
    );
    return { success: true, data: like };
  }

  @Delete()
  @UseGuards(UserJwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlike(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.reviewLikesService.unlikeReview(user.id, productId, reviewId);
  }
}