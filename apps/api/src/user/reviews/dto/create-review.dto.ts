import {
  IsInt,
  IsString,
  IsArray,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';

export class CreateReviewDto {
  @IsInt({ message: 'Rating must be an integer' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must be at most 5' })
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Body must be at most 2000 characters' })
  body?: string;

  @IsOptional()
  @IsInt({ message: 'Retailer ID must be an integer' })
  retailerId?: number;

  @IsOptional()
  @IsArray({ message: 'Tag codes must be an array' })
  @IsString({ each: true, message: 'Each tag code must be a string' })
  @MaxLength(30, { each: true, message: 'Each tag code must be at most 30 characters' })
  @ArrayMaxSize(20, { message: 'Maximum 20 tags allowed' })
  tagCodes?: string[];

  @IsOptional()
  @IsBoolean({ message: 'Repurchase intent must be a boolean' })
  repurchaseIntent?: boolean;
}