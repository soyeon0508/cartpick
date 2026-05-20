import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { AdminDashboardService } from './admin-dashboard.service';

@Controller('admin/v1/dashboard')
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get('statistics')
  getStatistics() {
    return this.dashboardService.getStatistics();
  }

  @Get('recent-activity')
  getRecentActivity(@Query('limit') limit?: string) {
    return this.dashboardService.getRecentActivity(
      limit ? parseInt(limit) : 10,
    );
  }
}