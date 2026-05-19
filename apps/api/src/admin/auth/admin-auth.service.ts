import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { createHash, randomBytes } from 'crypto';

export interface AdminJwtPayload {
  sub: number;
  email: string;
  role: 'admin';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: string;
  refreshExpiresAt: Date;
}

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getRefreshExpiresAt(): Date {
    const days = Number(this.config.get<string>('ADMIN_REFRESH_EXPIRY_DAYS', '7'));
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  }

  async issueTokens(
    admin: Pick<import('@prisma/client').Admin, 'id'>,
  ): Promise<AuthTokens> {
    const adminData = await this.prisma.admin.findUnique({
      where: { id: admin.id },
      select: {
        id: true,
        email: true,
      },
    });

    if (!adminData) {
      throw new UnauthorizedException('Admin not found');
    }

    const payload: AdminJwtPayload = {
      sub: adminData.id,
      email: adminData.email,
      role: 'admin',
    };

    const accessExpiresIn = this.config.get<string>('JWT_EXPIRY', '8h');
    const accessToken = this.jwt.sign(payload, { expiresIn: accessExpiresIn } as any);

    const refreshToken = randomBytes(48).toString('base64url');
    const refreshExpiresAt = this.getRefreshExpiresAt();

    await this.prisma.adminRefreshToken.create({
      data: {
        adminId: adminData.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: refreshExpiresAt,
      },
    });

    return { accessToken, refreshToken, accessExpiresIn, refreshExpiresAt };
  }

  async rotateRefreshToken(presented: string): Promise<AuthTokens> {
    const tokenHash = this.hashToken(presented);
    const existing = await this.prisma.adminRefreshToken.findUnique({
      where: { tokenHash },
      include: { admin: true },
    });

    if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!existing.admin.isActive) {
      throw new UnauthorizedException('Admin is not active');
    }

    await this.prisma.adminRefreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(existing.admin);
  }

  async login(email: string, password: string) {
    const admin = await this.prisma.admin.findUnique({ where: { email } });
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await argon2.verify(admin.passwordHash, password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(admin);

    return {
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
      tokens,
    };
  }

  async revokeRefreshToken(presented: string): Promise<void> {
    const tokenHash = this.hashToken(presented);
    await this.prisma.adminRefreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
