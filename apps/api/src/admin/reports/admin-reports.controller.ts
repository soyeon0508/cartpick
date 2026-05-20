import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminReportsService } from './admin-reports.service';
import { UpdateReportDto } from './dto/update-report.dto';

@Controller('admin/v1/reports')
export class AdminReportsController {
  constructor(private readonly reportsService: AdminReportsService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('reviewId') reviewId?: string,
  ) {
    return this.reportsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status as any,
      reviewId ? parseInt(reviewId) : undefined,
    );
  }

  @Get('statistics')
  getStatistics() {
    return this.reportsService.getStatistics();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReportDto: UpdateReportDto,
  ) {
    return this.reportsService.update(id, updateReportDto);
  }
}