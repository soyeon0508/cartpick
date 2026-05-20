import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateReportDto, ReportStatus } from './dto/update-report.dto';

@Injectable()
export class AdminReportsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    page: number = 1,
    limit: number = 20,
    status?: ReportStatus,
    reviewId?: number,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (reviewId) {
      where.reviewId = reviewId;
    }

    const [items, totalCount] = await Promise.all([
      this.prisma.reviewReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          review: {
            include: {
              user: {
                select: {
                  id: true,
                  nickname: true,
                  profileImage: true,
                },
              },
              product: true,
            },
          },
        },
      }),
      this.prisma.reviewReport.count({ where }),
    ]);

    return {
      items,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async findOne(id: number) {
    const report = await this.prisma.reviewReport.findUnique({
      where: { id },
      include: {
        review: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                profileImage: true,
              },
            },
            product: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return report;
  }

  async update(id: number, updateReportDto: UpdateReportDto) {
    await this.findOne(id);

    return this.prisma.reviewReport.update({
      where: { id },
      data: updateReportDto,
    });
  }

  async getStatistics() {
    const [
      totalReports,
      pendingReports,
      resolvedReports,
      dismissedReports,
    ] = await Promise.all([
      this.prisma.reviewReport.count(),
      this.prisma.reviewReport.count({ where: { status: 'pending' } }),
      this.prisma.reviewReport.count({ where: { status: 'resolved' } }),
      this.prisma.reviewReport.count({ where: { status: 'dismissed' } }),
    ]);

    return {
      totalReports,
      pendingReports,
      resolvedReports,
      dismissedReports,
    };
  }
}