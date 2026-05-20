import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateRetailerProductDto {
  @IsInt()
  @Min(1)
  retailerId!: number;

  @IsInt()
  @Min(1)
  productId!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  salePrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  retailerProductName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  retailerProductUrl?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  isNew?: boolean;
}
