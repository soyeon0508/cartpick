import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewLikesService {
  constructor(private readonly prisma: PrismaService) {}

  async likeReview(userId: number, productId: number, reviewId: number) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if review exists and belongs to the product
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.productId !== productId) {
      throw new NotFoundException('Review not found for this product');
    }

    // Create like and increment likeCount in a transaction
    const like = await this.prisma.$transaction(async (tx) => {
      const newLike = await tx.reviewLike.create({
        data: {
          userId,
          reviewId,
        },
      });

      await tx.review.update({
        where: { id: reviewId },
        data: {
          likeCount: {
            increment: 1,
          },
        },
      });

      return newLike;
    });

    return like;
  }

  async unlikeReview(userId: number, productId: number, reviewId: number) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if review exists and belongs to the product
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.productId !== productId) {
      throw new NotFoundException('Review not found for this product');
    }

    // Find the like
    const like = await this.prisma.reviewLike.findUnique({
      where: {
        userId_reviewId: {
          userId,
          reviewId,
        },
      },
    });

    if (!like) {
      throw new NotFoundException('Like not found');
    }

    // Delete like and decrement likeCount in a transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.reviewLike.delete({
        where: {
          userId_reviewId: {
            userId,
            reviewId,
          },
        },
      });

      await tx.review.update({
        where: { id: reviewId },
        data: {
          likeCount: {
            decrement: 1,
          },
        },
      });
    });
  }
}