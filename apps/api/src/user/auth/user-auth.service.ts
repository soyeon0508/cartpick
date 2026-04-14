import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

export interface UserJwtPayload {
  sub: number;
  role: 'user';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: string;
  refreshExpiresAt: Date;
}

@Injectable()
export class UserAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getRefreshExpiresAt(): Date {
    const days = Number(this.config.get<string>('USER_REFRESH_EXPIRY_DAYS', '30'));
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  }

  async issueTokens(
    user: Pick<User, 'id'>,
    context?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthTokens> {
    const payload: UserJwtPayload = { sub: user.id, role: 'user' };
    const accessExpiresIn = this.config.get<string>('USER_ACCESS_EXPIRY', '30m');
    const accessToken = this.jwt.sign(payload, { expiresIn: accessExpiresIn } as any);

    const refreshToken = randomBytes(48).toString('base64url');
    const refreshExpiresAt = this.getRefreshExpiresAt();

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        userAgent: context?.userAgent?.slice(0, 300),
        ipAddress: context?.ipAddress?.slice(0, 45),
        expiresAt: refreshExpiresAt,
      },
    });

    return { accessToken, refreshToken, accessExpiresIn, refreshExpiresAt };
  }

  async rotateRefreshToken(
    presented: string,
    context?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthTokens> {
    const tokenHash = this.hashToken(presented);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (existing.user.status !== 'active') {
      throw new UnauthorizedException('User is not active');
    }

    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(existing.user, context);
  }

  async revokeRefreshToken(presented: string): Promise<void> {
    const tokenHash = this.hashToken(presented);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: number): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
