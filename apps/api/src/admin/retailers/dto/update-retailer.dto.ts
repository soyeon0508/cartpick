import { LaunchStatus, RetailerType } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Length, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRetailerDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  slug?: string;

  @IsOptional()
  @IsEnum(RetailerType)
  retailerType?: RetailerType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @IsOptional()
  @IsEnum(LaunchStatus)
  launchStatus?: LaunchStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
