import { IsString, IsOptional, IsBoolean, IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Country ID' })
  @IsInt()
  @IsNotEmpty()
  countryId: number;

  @ApiProperty({ description: 'Category name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Parent category ID' })
  @IsInt()
  @IsOptional()
  parentId?: number;

  @ApiPropertyOptional({ description: 'Display order' })
  @IsInt()
  @IsOptional()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Icon URL' })
  @IsString()
  @IsOptional()
  iconUrl?: string;

  @ApiPropertyOptional({ description: 'Whether the category is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}