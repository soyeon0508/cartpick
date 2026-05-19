import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { QueryReviewsDto, SortOrder } from './dto/query-reviews.dto';
import { Prisma } from '@prisma/client';

const REVIEW_CREATE_MAX_RETRIES = 3;

@Injectable()
export class UserReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, productId: number, dto: CreateReviewDto) {
    for (let attempt = 1; attempt <= REVIEW_CREATE_MAX_RETRIES; attempt++) {
      try {
        return await this.createInSerializableTransaction(userId, productId, dto);
      } catch (error) {
        if (
          attempt < REVIEW_CREATE_MAX_RETRIES &&
          this.isSerializationConflict(error)
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new Error('Review creation failed after retry attempts');
  }

  private async createInSerializableTransaction(
    userId: number,
    productId: number,
    dto: CreateReviewDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Check if product exists
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // Validate retailerId if provided
      if (dto.retailerId) {
        const retailer = await tx.retailer.findUnique({
          where: { id: dto.retailerId },
        });

        if (!retailer) {
          throw new NotFoundException('Retailer not found');
        }

        // Optionally validate retailer is connected to product
        const retailerProduct = await tx.retailerProduct.findUnique({
          where: {
            retailerId_productId: {
              retailerId: dto.retailerId,
              productId,
            },
          },
        });

        if (!retailerProduct) {
          throw new BadRequestException('Retailer is not connected to this product');
        }
      }

      // Check if user already reviewed this product
      const existingReview = await tx.review.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });

      if (existingReview) {
        throw new ConflictException('User has already reviewed this product');
      }

      // Check if this is the first visible review for the product
      const visibleReviewCount = await tx.review.count({
        where: {
          productId,
          moderationStatus: 'visible',
        },
      });

      const isFirstReview = visibleReviewCount === 0;

      // Create review
      const review = await tx.review.create({
        data: {
          userId,
          productId,
          rating: dto.rating,
          body: dto.body || '',
          retailerId: dto.retailerId,
          repurchaseIntent: dto.repurchaseIntent,
        },
      });

      // Create tags if provided
      if (dto.tagCodes && dto.tagCodes.length > 0) {
        const uniqueTags = [...new Set(dto.tagCodes)]; // Remove duplicates
        await tx.reviewTag.createMany({
          data: uniqueTags.map((tagCode) => ({
            reviewId: review.id,
            tagCode,
          })),
        });
      }

      // Award first reviewer badge if this is the first visible review
      if (isFirstReview) {
        const badgeType = await tx.badgeType.findUnique({
          where: { code: 'first_reviewer' },
        });

        if (badgeType) {
          // Use upsert to prevent duplicate awards (unique constraint on userId + badgeTypeId)
          await tx.userBadge.upsert({
            where: {
              userId_badgeTypeId: {
                userId,
                badgeTypeId: badgeType.id,
              },
            },
            update: {},
            create: {
              userId,
              badgeTypeId: badgeType.id,
            },
          });
        }
        // If badge type doesn't exist, skip awarding (should be created by seed)
      }

      // Update product aggregates
      await this.updateProductAggregates(tx, productId);

      // Fetch the complete review with tags
      const completeReview = await tx.review.findUnique({
        where: { id: review.id },
        include: {
          tags: {
            select: {
              tagCode: true,
            },
          },
        },
      });

      return {
        id: completeReview!.id,
        rating: completeReview!.rating,
        body: completeReview!.body,
        retailerId: completeReview!.retailerId,
        repurchaseIntent: completeReview!.repurchaseIntent,
        tags: completeReview!.tags.map((t) => t.tagCode),
        createdAt: completeReview!.createdAt,
        updatedAt: completeReview!.updatedAt,
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  async update(userId: number, productId: number, dto: UpdateReviewDto) {
    return this.prisma.$transaction(async (tx) => {
      // Check if product exists
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // Validate retailerId if provided
      if (dto.retailerId) {
        const retailer = await tx.retailer.findUnique({
          where: { id: dto.retailerId },
        });

        if (!retailer) {
          throw new NotFoundException('Retailer not found');
        }

        // Optionally validate retailer is connected to product
        const retailerProduct = await tx.retailerProduct.findUnique({
          where: {
            retailerId_productId: {
              retailerId: dto.retailerId,
              productId,
            },
          },
        });

        if (!retailerProduct) {
          throw new BadRequestException('Retailer is not connected to this product');
        }
      }

      // Check if review exists
      const existingReview = await tx.review.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });

      if (!existingReview) {
        throw new NotFoundException('Review not found');
      }

      // Update review
      const review = await tx.review.update({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
        data: {
          rating: dto.rating,
          body: dto.body,
          retailerId: dto.retailerId,
          repurchaseIntent: dto.repurchaseIntent,
        },
      });

      // Replace tags if provided
      if (dto.tagCodes !== undefined) {
        // Delete existing tags
        await tx.reviewTag.deleteMany({
          where: { reviewId: review.id },
        });

        // Create new tags if any
        if (dto.tagCodes.length > 0) {
          const uniqueTags = [...new Set(dto.tagCodes)]; // Remove duplicates
          await tx.reviewTag.createMany({
            data: uniqueTags.map((tagCode) => ({
              reviewId: review.id,
              tagCode,
            })),
          });
        }
      }

      // Update product aggregates
      await this.updateProductAggregates(tx, productId);

      // Fetch the complete review with tags
      const completeReview = await tx.review.findUnique({
        where: { id: review.id },
        include: {
          tags: {
            select: {
              tagCode: true,
            },
          },
        },
      });

      return {
        id: completeReview!.id,
        rating: completeReview!.rating,
        body: completeReview!.body,
        retailerId: completeReview!.retailerId,
        repurchaseIntent: completeReview!.repurchaseIntent,
        tags: completeReview!.tags.map((t) => t.tagCode),
        createdAt: completeReview!.createdAt,
        updatedAt: completeReview!.updatedAt,
      };
    });
  }

  async delete(userId: number, productId: number) {
    return this.prisma.$transaction(async (tx) => {
      // Check if product exists
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // Check if review exists
      const existingReview = await tx.review.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });

      if (!existingReview) {
        throw new NotFoundException('Review not found');
      }

      // Delete review (tags will be cascade deleted)
      await tx.review.delete({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });

      // Update product aggregates
      await this.updateProductAggregates(tx, productId);
    });
  }

  async findAllByProduct(productId: number, query: QueryReviewsDto) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const { page = 1, limit = 20, sort = SortOrder.RECENT } = query;
    const skip = (page - 1) * limit;

    // Determine sort order
    let orderBy: Prisma.ReviewOrderByWithRelationInput[] | Prisma.ReviewOrderByWithRelationInput;
    if (sort === SortOrder.HELPFUL) {
      orderBy = [
        { likeCount: 'desc' as const },
        { createdAt: 'desc' as const },
      ];
    } else {
      orderBy = { createdAt: 'desc' as const };
    }

    // Fetch reviews with pagination
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: {
          productId,
          moderationStatus: 'visible',
        },
        include: {
          tags: {
            select: {
              tagCode: true,
            },
          },
          user: {
            select: {
              id: true,
              nickname: true,
              profileImage: true,
            },
          },
          retailer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.review.count({
        where: {
          productId,
          moderationStatus: 'visible',
        },
      }),
    ]);

    return {
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        body: review.body,
        tags: review.tags.map((t) => t.tagCode),
        repurchaseIntent: review.repurchaseIntent,
        likeCount: review.likeCount,
        retailer: review.retailer,
        user: review.user,
        createdAt: review.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  async findMyReview(userId: number, productId: number) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const review = await this.prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      include: {
        tags: {
          select: {
            tagCode: true,
          },
        },
        retailer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return {
      id: review.id,
      rating: review.rating,
      body: review.body,
      tags: review.tags.map((t) => t.tagCode),
      repurchaseIntent: review.repurchaseIntent,
      likeCount: review.likeCount,
      retailer: review.retailer,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }

  private async updateProductAggregates(tx: Prisma.TransactionClient, productId: number) {
    // Count visible reviews
    const reviewCount = await tx.review.count({
      where: {
        productId,
        moderationStatus: 'visible',
      },
    });

    // Calculate average rating from visible reviews
    const reviews = await tx.review.findMany({
      where: {
        productId,
        moderationStatus: 'visible',
      },
      select: {
        rating: true,
      },
    });

    let averageRating = 0;
    if (reviewCount > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      averageRating = Math.round((totalRating / reviewCount) * 10) / 10; // Round to 1 decimal
    }

    // Update product
    await tx.product.update({
      where: { id: productId },
      data: {
        reviewCount,
        averageRating,
      },
    });
  }

  private isSerializationConflict(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2034'
    );
  }
}
