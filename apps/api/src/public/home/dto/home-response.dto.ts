import { ApiProperty } from '@nestjs/swagger';
import { SectionType } from '@prisma/client';

export class ProductCardDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  imageUrl?: string;

  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  reviewCount: number;

  @ApiProperty({ required: false, nullable: true })
  minPrice?: number | null;

  @ApiProperty({ required: false, nullable: true })
  maxPrice?: number | null;
}

export class HomeSectionDto {
  @ApiProperty({ enum: SectionType })
  type: SectionType;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  subtitle?: string;

  @ApiProperty({ type: [ProductCardDto] })
  products: ProductCardDto[];
}

export class HomeResponseDto {
  @ApiProperty()
  countryCode: string;

  @ApiProperty({ type: [HomeSectionDto] })
  sections: HomeSectionDto[];
}