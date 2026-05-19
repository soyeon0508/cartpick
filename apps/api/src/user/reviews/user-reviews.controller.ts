import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
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
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const review = await this.reviewsService.create(
      user.id,
      productId,
      dto,
    );

    return {
      success: true,
      data: review,
    };
  }

  @Put('me')
  async update(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: UpdateReviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const review = await this.reviewsService.update(
      user.id,
      productId,
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
    @Param('productId', ParseIntPipe) productId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.reviewsService.delete(user.id, productId);
  }
}
