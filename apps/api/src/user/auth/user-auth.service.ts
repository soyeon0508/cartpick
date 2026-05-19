import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import * as argon2 from 'argon2';
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

  async signup(
    email: string,
    password: string,
    nickname: string,
    context?: { userAgent?: string; ipAddress?: string },
  ) {
    // Check if email already exists
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // Check if nickname already exists
    const existingNickname = await this.prisma.user.findUnique({
      where: { nickname },
    });
    if (existingNickname) {
      throw new ConflictException('Nickname already exists');
    }

    // Hash password
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        nickname,
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        status: true,
      },
    });

    // Issue tokens
    const tokens = await this.issueTokens(user, context);

    return {
      user,
      tokens,
    };
  }

  async login(
    email: string,
    password: string,
    context?: { userAgent?: string; ipAddress?: string },
  ) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Check if user exists and has password
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check user status
    if (user.status !== 'active') {
      throw new UnauthorizedException('User is not active');
    }

    // Issue tokens
    const tokens = await this.issueTokens(user, context);

    return {
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        status: user.status,
      },
      tokens,
    };
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        profileImage: true,
        status: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
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
