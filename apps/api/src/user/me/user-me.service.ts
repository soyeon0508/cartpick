import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserMeService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        profileImage: true,
        countryId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get review statistics
    const totalReviews = await this.prisma.review.count({
      where: { userId },
    });

    // Get bookmark count
    const totalBookmarks = await this.prisma.bookmark.count({
      where: { userId },
    });

    // Get liked reviews count
    const totalLikes = await this.prisma.reviewLike.count({
      where: { userId },
    });

    return {
      ...user,
      stats: {
        totalReviews,
        totalBookmarks,
        totalLikes,
      },
    };
  }
}