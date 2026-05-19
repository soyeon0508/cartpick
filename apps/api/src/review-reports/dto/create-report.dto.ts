import { IsString, IsOptional, IsIn, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @IsIn(['spam', 'inappropriate', 'misleading', 'offensive'], {
    message: 'Reason must be one of: spam, inappropriate, misleading, offensive',
  })
  @IsNotEmpty({ message: 'Reason is required' })
  reason!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;
}