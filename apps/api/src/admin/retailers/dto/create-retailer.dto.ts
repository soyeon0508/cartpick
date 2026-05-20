import { IsString, IsOptional, IsBoolean, IsInt, IsNotEmpty, IsUrl, IsEnum } from 'class-validator';

export enum RetailerType {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  BOTH = 'BOTH',
}

export class CreateRetailerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  countryId: string;

  @IsString()
  @IsOptional()
  nameEn?: string;

  @IsUrl()
  @IsOptional()
  websiteUrl?: string;

  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @IsEnum(RetailerType)
  @IsOptional()
  type?: RetailerType;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}