import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserAuthController } from './user-auth.controller';
import { UserAuthService } from './user-auth.service';
import { UserJwtStrategy } from './strategies/user-jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>(
          'USER_JWT_SECRET',
          'dev-user-jwt-secret-change-in-production',
        );
        const expiresIn = config.get<string>('USER_ACCESS_EXPIRY', '30m');
        return { secret, signOptions: { expiresIn } } as any;
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [UserAuthController],
  providers: [UserAuthService, UserJwtStrategy],
  exports: [UserAuthService, UserJwtStrategy, JwtModule],
})
export class UserAuthModule {}
