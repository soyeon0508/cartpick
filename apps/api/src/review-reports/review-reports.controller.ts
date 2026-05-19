import { Controller, Post, Param, Body, UseGuards, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { ReviewReportsService } from './review-reports.service';
import { UserJwtGuard } from '../user/auth/guards/user-jwt.guard';
import { CurrentUser } from '../user/auth/decorators/current-user.decorator';
import { CreateReportDto } from './dto/create-report.dto';
import type { AuthenticatedUser } from '../user/auth/strategies/user-jwt.strategy';

@Controller('v1/products')
@UseGuards(UserJwtGuard)
export class ReviewReportsController {
  constructor(private readonly reportsService: ReviewReportsService) {}

  @Post(':productId/reviews/:reviewId/reports')
  async create(
    @Param('productId', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND })) productId: number,
    @Param('reviewId', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND })) reviewId: number,
    @Body() createReportDto: CreateReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const report = await this.reportsService.create({
      reviewId,
      reporterUserId: user.id,
      reason: createReportDto.reason,
      description: createReportDto.description,
    });

    return {
      success: true,
      data: report,
    };
  }
}