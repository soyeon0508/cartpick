import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PublicProductsService } from './public-products.service';

@Controller('v1/products')
export class PublicProductsController {
  constructor(private readonly products: PublicProductsService) {}

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.products.findOne(id);
  }
}
