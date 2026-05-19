import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserReviewsService } from './user-reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';
import { UserJwtGuard } from '../auth/guards/user-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/user-jwt.strategy';

@Controller('v1/products/:productId/reviews')
export class UserReviewsController {
  constructor(private readonly reviewsService: UserReviewsService) {}

  @Get('me')
  @UseGuards(UserJwtGuard)
  async getMyReview(
    @Param('productId', ParseIntPipe) productId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const review = await this.reviewsService.findMyReview(user.id, productId);
    return { success: true, data: review };
  }

  @Get()
  async findAll(
    @Param('productId', ParseIntPipe) productId: number,
    @Query() query: QueryReviewsDto,
  ) {
    const result = await this.reviewsService.findAllByProduct(productId, query);
    return { success: true, data: result };
  }

  @Post()
  @UseGuards(UserJwtGuard)
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
  @UseGuards(UserJwtGuard)
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
  @UseGuards(UserJwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('productId', ParseIntPipe) productId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.reviewsService.delete(user.id, productId);
  }
}
