import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductBookmarksService } from './product-bookmarks.service';
import { UserJwtGuard } from '../auth/guards/user-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { QueryBookmarksDto } from './dto/query-bookmarks.dto';
import type { AuthenticatedUser } from '../auth/strategies/user-jwt.strategy';

@Controller('v1/products')
@UseGuards(UserJwtGuard)
export class ProductBookmarksController {
  constructor(private readonly bookmarksService: ProductBookmarksService) {}

  @Post(':productId/bookmarks')
  async create(
    @Param('productId', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND })) productId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const bookmark = await this.bookmarksService.create(user.id, productId);
    return {
      success: true,
      data: bookmark,
    };
  }

  @Delete(':productId/bookmarks')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('productId', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND })) productId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.bookmarksService.remove(user.id, productId);
  }
}

@Controller('v1/users')
@UseGuards(UserJwtGuard)
export class UserBookmarksController {
  constructor(private readonly bookmarksService: ProductBookmarksService) {}

  @Get('bookmarks')
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryBookmarksDto,
  ) {
    const result = await this.bookmarksService.findAll(user.id, query);
    return {
      success: true,
      data: result,
    };
  }
}
