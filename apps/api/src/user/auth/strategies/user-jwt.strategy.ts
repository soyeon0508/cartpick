import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserJwtPayload } from '../user-auth.service';

export interface AuthenticatedUser {
  id: number;
  nickname: string;
  role: 'user';
}

@Injectable()
export class UserJwtStrategy extends PassportStrategy(Strategy, 'user-jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>(
        'USER_JWT_SECRET',
        'dev-user-jwt-secret-change-in-production',
      ),
    });
  }

  async validate(payload: UserJwtPayload): Promise<AuthenticatedUser> {
    if (payload.role !== 'user') {
      throw new UnauthorizedException();
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException();
    }

    return { id: user.id, nickname: user.nickname, role: 'user' };
  }
}
