import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { QueryBookmarksDto } from './dto/query-bookmarks.dto';

@Injectable()
export class ProductBookmarksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, productId: number) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if already bookmarked
    const existingBookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingBookmark) {
      throw new ConflictException('Product already bookmarked');
    }

    // Create bookmark
    const bookmark = await this.prisma.bookmark.create({
      data: {
        userId,
        productId,
      },
    });

    return bookmark;
  }

  async remove(userId: number, productId: number) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if bookmark exists
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    // Delete bookmark
    await this.prisma.bookmark.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });
  }

  async findAll(userId: number, query: QueryBookmarksDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 50);
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      this.prisma.bookmark.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            include: {
              brand: true,
              category: true,
              reviews: {
                where: { moderationStatus: 'visible' },
                select: { rating: true },
              },
            },
          },
        },
      }),
      this.prisma.bookmark.count({
        where: { userId },
      }),
    ]);

    // Calculate average rating and review count for each product
    const bookmarksWithProductData = bookmarks.map((bookmark) => {
      const reviews = bookmark.product.reviews;
      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      return {
        id: bookmark.id,
        productId: bookmark.productId,
        product: {
          id: bookmark.product.id,
          name: bookmark.product.name,
          imageUrl: bookmark.product.imageUrl,
          averageRating: Math.round(averageRating * 10) / 10,
          reviewCount: reviews.length,
          brand: bookmark.product.brand
            ? {
                id: bookmark.product.brand.id,
                name: bookmark.product.brand.name,
              }
            : null,
          category: bookmark.product.category
            ? {
                id: bookmark.product.category.id,
                name: bookmark.product.category.name,
              }
            : null,
        },
        createdAt: bookmark.createdAt,
      };
    });

    return {
      bookmarks: bookmarksWithProductData,
      total,
      page,
      limit,
    };
  }
}