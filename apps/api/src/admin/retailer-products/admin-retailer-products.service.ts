import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRetailerProductDto } from './dto/create-retailer-product.dto';
import { UpdateRetailerProductDto } from './dto/update-retailer-product.dto';

@Injectable()
export class AdminRetailerProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByProduct(productId: number) {
    return this.prisma.retailerProduct.findMany({
      where: { productId },
      include: {
        retailer: { select: { id: true, name: true, slug: true, logoUrl: true } },
      },
      orderBy: { retailer: { name: 'asc' } },
    });
  }

  async create(dto: CreateRetailerProductDto) {
    const existing = await this.prisma.retailerProduct.findUnique({
      where: { retailerId_productId: { retailerId: dto.retailerId, productId: dto.productId } },
    });
    if (existing) {
      throw new ConflictException({
        error: 'CONFLICT',
        message: 'This retailer is already linked to this product',
      });
    }

    return this.prisma.retailerProduct.create({
      data: { ...dto, sourceType: 'manual' },
      include: {
        retailer: { select: { id: true, name: true, slug: true, logoUrl: true } },
      },
    });
  }

  async update(id: number, dto: UpdateRetailerProductDto) {
    const existing = await this.prisma.retailerProduct.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: `RetailerProduct ${id} not found` });
    }

    return this.prisma.retailerProduct.update({
      where: { id },
      data: dto,
      include: {
        retailer: { select: { id: true, name: true, slug: true, logoUrl: true } },
      },
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.retailerProduct.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: `RetailerProduct ${id} not found` });
    }

    await this.prisma.retailerProduct.delete({ where: { id } });
    return { id };
  }
}
