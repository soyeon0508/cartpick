import { IsInt, Min, Max, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export enum SortOrder {
  RECENT = 'recent',
  HELPFUL = 'helpful',
}

export class QueryReviewsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(SortOrder)
  sort?: SortOrder = SortOrder.RECENT;
}