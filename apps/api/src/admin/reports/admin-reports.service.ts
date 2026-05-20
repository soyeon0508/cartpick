import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportAction, UpdateReportDto } from './dto/update-report.dto';

@Injectable()
export class AdminReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(status?: string, limit = 20, offset = 0) {
    const where: any = {};
    if (status) where.status = status;

    const [items, totalCount] = await this.prisma.$transaction([
      this.prisma.reviewReport.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          review: {
            select: { id: true, body: true, moderationStatus: true },
          },
          reporter: {
            select: { id: true, nickname: true },
          },
          resolver: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.reviewReport.count({ where }),
    ]);

    return { items, totalCount };
  }

  async findOne(id: number) {
    const report = await this.prisma.reviewReport.findUnique({
      where: { id },
      include: {
        review: { select: { id: true, body: true, moderationStatus: true } },
        reporter: { select: { id: true, nickname: true } },
        resolver: { select: { id: true, name: true } },
      },
    });
    if (!report) throw new NotFoundException({ error: 'NOT_FOUND', message: `Report ${id} not found` });
    return report;
  }

  async update(id: number, dto: UpdateReportDto, adminId: number) {
    await this.findOne(id);

    const newStatus = dto.action === ReportAction.RESOLVE ? 'resolved' : 'dismissed';

    return this.prisma.$transaction(async (tx) => {
      const report = await tx.reviewReport.update({
        where: { id },
        data: {
          status: newStatus,
          resolvedBy: adminId,
          resolvedAt: new Date(),
        },
      });

      if (dto.action === ReportAction.RESOLVE) {
        await tx.review.update({
          where: { id: report.reviewId },
          data: { moderationStatus: 'hidden' },
        });
      }

      return report;
    });
  }
}
