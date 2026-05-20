import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private prisma: PrismaService) {}

  async getStatistics() {
    const [
      totalUsers,
      totalProducts,
      totalReviews,
      totalRetailers,
      totalBrands,
      totalCategories,
      activeUsers,
      activeProducts,
      visibleReviews,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.product.count(),
      this.prisma.review.count(),
      this.prisma.retailer.count(),
      this.prisma.brand.count(),
      this.prisma.category.count(),
      this.prisma.user.count({ where: { status: 'active' } }),
      this.prisma.product.count({ where: { status: 'active' } }),
      this.prisma.review.count({ where: { moderationStatus: 'visible' } }),
    ]);

    // Get recent reviews (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentReviews = await this.prisma.review.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Get recent users (last 7 days)
    const recentUsers = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        recent: recentUsers,
      },
      products: {
        total: totalProducts,
        active: activeProducts,
      },
      reviews: {
        total: totalReviews,
        visible: visibleReviews,
        recent: recentReviews,
      },
      retailers: {
        total: totalRetailers,
      },
      brands: {
        total: totalBrands,
      },
      categories: {
        total: totalCategories,
      },
    };
  }

  async getRecentActivity(limit: number = 10) {
    // Get recent reviews
    const recentReviews = await this.prisma.review.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    });

    return {
      recentReviews,
    };
  }
}