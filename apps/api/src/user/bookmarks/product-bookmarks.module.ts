import { Module } from '@nestjs/common';
import { ProductBookmarksService } from './product-bookmarks.service';
import { ProductBookmarksController, UserBookmarksController } from './product-bookmarks.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProductBookmarksController, UserBookmarksController],
  providers: [ProductBookmarksService],
  exports: [ProductBookmarksService],
})
export class ProductBookmarksModule {}