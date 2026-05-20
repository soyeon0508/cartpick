import { IsBoolean, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @Length(1, 100)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  nameEn?: string;

  @IsString()
  @Length(1, 100)
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
