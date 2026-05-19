import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserReviewsService } from './user-reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { UserJwtGuard } from '../auth/guards/user-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/user-jwt.strategy';

@Controller('v1/products/:productId/reviews')
@UseGuards(UserJwtGuard)
export class UserReviewsController {
  constructor(private readonly reviewsService: UserReviewsService) {}

  @Post()
  async create(
    @Param('productId') productId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const parsedProductId = parseInt(productId, 10);
    if (isNaN(parsedProductId)) {
      return { success: false, message: 'Invalid product ID' };
    }

    const review = await this.reviewsService.create(
      user.id,
      parsedProductId,
      dto,
    );

    return {
      success: true,
      data: review,
    };
  }

  @Put('me')
  async update(
    @Param('productId') productId: string,
    @Body() dto: UpdateReviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const parsedProductId = parseInt(productId, 10);
    if (isNaN(parsedProductId)) {
      return { success: false, message: 'Invalid product ID' };
    }

    const review = await this.reviewsService.update(
      user.id,
      parsedProductId,
      dto,
    );

    return {
      success: true,
      data: review,
    };
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('productId') productId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const parsedProductId = parseInt(productId, 10);
    if (isNaN(parsedProductId)) {
      throw new Error('Invalid product ID');
    }

    await this.reviewsService.delete(user.id, parsedProductId);
  }
}