import { IsOptional, IsString, IsUrl, Length, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 30, {
    message: 'Nickname must be between 1 and 30 characters',
  })
  nickname?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Profile image must be a valid URL' })
  profileImage?: string;
}