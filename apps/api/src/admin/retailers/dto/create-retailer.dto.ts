import { LaunchStatus, RetailerType } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, Length, MaxLength, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRetailerDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  countryId!: number;

  @IsString()
  @Length(1, 50)
  name!: string;

  @IsString()
  @Length(1, 50)
  slug!: string;

  @IsEnum(RetailerType)
  retailerType!: RetailerType;

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
