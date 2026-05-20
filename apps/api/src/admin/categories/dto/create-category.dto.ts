import { IsBoolean, IsInt, IsOptional, IsString, Length, MaxLength, Min } from 'class-validator';

export class CreateCategoryDto {
  @IsInt()
  @Min(1)
  countryId!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  parentId?: number;

  @IsString()
  @Length(1, 50)
  name!: string;

  @IsString()
  @Length(1, 50)
  slug!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  iconUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
