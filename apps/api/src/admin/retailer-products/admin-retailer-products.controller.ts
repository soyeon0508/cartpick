import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseIntPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { AdminRetailerProductsService } from './admin-retailer-products.service';
import { CreateRetailerProductDto } from './dto/create-retailer-product.dto';
import { UpdateRetailerProductDto } from './dto/update-retailer-product.dto';

@Controller('admin/v1/retailer-products')
@UseGuards(AdminJwtGuard)
export class AdminRetailerProductsController {
  constructor(private readonly retailerProducts: AdminRetailerProductsService) {}

  @Get()
  findByProduct(@Query('productId', ParseIntPipe) productId: number) {
    return this.retailerProducts.findByProduct(productId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateRetailerProductDto) {
    return this.retailerProducts.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRetailerProductDto,
  ) {
    return this.retailerProducts.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.retailerProducts.remove(id);
  }
}
