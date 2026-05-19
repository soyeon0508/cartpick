import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportStatus } from '@prisma/client';

export type CreateReportInput = {
  reviewId: number;
  reporterUserId: number;
  reason: string;
  description?: string;
};

@Injectable()
export class ReviewReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateReportInput) {
    const { reviewId, reporterUserId, reason, description } = data;

    // Validate reason enum
    const validReasons = ['spam', 'inappropriate', 'misleading', 'offensive'];
    if (!validReasons.includes(reason)) {
      throw new BadRequestException(`Invalid reason. Must be one of: ${validReasons.join(', ')}`);
    }

    // Check if review exists
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, reportedCount: true, moderationStatus: true },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check if user already reported this review
    const existingReport = await this.prisma.reviewReport.findFirst({
      where: {
        reviewId,
        reporterUserId,
      },
    });

    if (existingReport) {
      throw new ConflictException('You have already reported this review');
    }

    // Create report and increment reportedCount in a transaction
    const [report] = await this.prisma.$transaction([
      this.prisma.reviewReport.create({
        data: {
          reviewId,
          reporterUserId,
          reason,
          description,
          status: ReportStatus.pending,
        },
      }),
      this.prisma.review.update({
        where: { id: reviewId },
        data: {
          reportedCount: {
            increment: 1,
          },
          // Auto-moderate if reportedCount >= 5
          moderationStatus: review.reportedCount + 1 >= 5 ? 'reported' : undefined,
        },
      }),
    ]);

    return report;
  }
}