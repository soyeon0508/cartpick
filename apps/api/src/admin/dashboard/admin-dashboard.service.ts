import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalProducts, totalReviews, newReviewsToday, pendingReports] =
      await this.prisma.$transaction([
        this.prisma.product.count(),
        this.prisma.review.count(),
        this.prisma.review.count({ where: { createdAt: { gte: today } } }),
        this.prisma.reviewReport.count({ where: { status: 'pending' } }),
      ]);

    return { totalProducts, totalReviews, newReviewsToday, pendingReports };
  }
}
