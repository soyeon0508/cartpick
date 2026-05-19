import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserMeService } from './user-me.service';
import { UserJwtGuard } from '../auth/guards/user-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('v1/users/me')
@UseGuards(UserJwtGuard)
export class UserMeController {
  constructor(private readonly userMeService: UserMeService) {}

  @Get()
  async getMe(@CurrentUser('id') userId: number) {
    return this.userMeService.getMe(userId);
  }
}