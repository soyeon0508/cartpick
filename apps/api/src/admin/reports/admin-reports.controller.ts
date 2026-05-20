import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Param, ParseIntPipe, Patch, Query, UseGuards,
} from '@nestjs/common';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';
import { AdminReportsService } from './admin-reports.service';
import { UpdateReportDto } from './dto/update-report.dto';

@Controller('admin/v1/reports')
@UseGuards(AdminJwtGuard)
export class AdminReportsController {
  constructor(private readonly reports: AdminReportsService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.reports.findAll(
      status,
      limit ? parseInt(limit) : 20,
      offset ? parseInt(offset) : 0,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reports.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReportDto,
    @CurrentAdmin() admin: { id: number },
  ) {
    return this.reports.update(id, dto, admin.id);
  }
}
