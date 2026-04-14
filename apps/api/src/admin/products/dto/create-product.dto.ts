import { ProductStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsInt()
  @Min(1)
  countryId!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  brandId?: number;

  @IsInt()
  @Min(1)
  categoryId!: number;

  @IsString()
  @Length(1, 200)
  name!: string;

  @IsString()
  @Length(1, 200)
  normalizedName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  barcode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  volumeValue?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  volumeUnit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  packageType?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
