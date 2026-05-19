import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('admin/v1/auth')
export class AdminAuthController {
  constructor(private readonly authService: AdminAuthService) {}

  @Post('login')
  async login(@Body() dto: AdminLoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.rotateRefreshToken(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.revokeRefreshToken(dto.refreshToken);
  }
}
