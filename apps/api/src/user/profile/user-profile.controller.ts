import { Controller, Get, Patch, UseGuards, Body } from '@nestjs/common';
import { UserProfileService } from './user-profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserJwtGuard } from '../auth/guards/user-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('v1/users/profile')
@UseGuards(UserJwtGuard)
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @Get()
  async getProfile(@CurrentUser('id') userId: number) {
    return this.userProfileService.getProfile(userId);
  }

  @Patch()
  async updateProfile(
    @CurrentUser('id') userId: number,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.userProfileService.updateProfile(userId, updateProfileDto);
  }
}