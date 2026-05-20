import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseIntPipe, Post, Put, Query, UseGuards,
} from '@nestjs/common';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { AdminRetailersService } from './admin-retailers.service';
import { CreateRetailerDto } from './dto/create-retailer.dto';
import { UpdateRetailerDto } from './dto/update-retailer.dto';

@Controller('admin/v1/retailers')
@UseGuards(AdminJwtGuard)
export class AdminRetailersController {
  constructor(private readonly retailers: AdminRetailersService) {}

  @Get()
  findAll(
    @Query('countryId') countryId?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.retailers.findAll(
      countryId ? parseInt(countryId) : undefined,
      isActive !== undefined ? isActive === 'true' : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.retailers.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateRetailerDto) {
    return this.retailers.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRetailerDto) {
    return this.retailers.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.retailers.remove(id);
  }
}
