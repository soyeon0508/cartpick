import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { UserAuthService } from './user-auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UserJwtGuard } from './guards/user-jwt.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthenticatedUser } from './strategies/user-jwt.strategy';

@Controller('v1/auth')
export class UserAuthController {
  constructor(private readonly authService: UserAuthService) {}

  @Post('signup')
  async signup(
    @Body() dto: SignupDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    const userAgent = req.headers['user-agent'];
    return this.authService.signup(dto.email, dto.password, dto.nickname, {
      userAgent,
      ipAddress: ip,
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    const userAgent = req.headers['user-agent'];
    return this.authService.login(dto.email, dto.password, {
      userAgent,
      ipAddress: ip,
    });
  }

  @Get('me')
  @UseGuards(UserJwtGuard)
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.id);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    const userAgent = req.headers['user-agent'];
    return this.authService.rotateRefreshToken(dto.refreshToken, {
      userAgent,
      ipAddress: ip,
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.revokeRefreshToken(dto.refreshToken);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(UserJwtGuard)
  async logoutAll(@CurrentUser() user: AuthenticatedUser) {
    await this.authService.revokeAllForUser(user.id);
  }
}
