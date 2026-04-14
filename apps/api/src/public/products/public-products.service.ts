import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PublicProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: number) {
    const product = await this.prisma.product.findFirst({
      where: { id, status: ProductStatus.active },
      include: {
        brand: true,
        category: true,
        retailerProducts: {
          where: { isAvailable: true },
          include: { retailer: true },
        },
      },
    });

    if (!product) throw new NotFoundException(`Product ${id} not found`);

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      barcode: product.barcode,
      volume:
        product.volumeValue && product.volumeUnit
          ? `${product.volumeValue}${product.volumeUnit}`
          : null,
      packageType: product.packageType,
      averageRating: Number(product.averageRating),
      reviewCount: product.reviewCount,
      brand: product.brand
        ? {
            id: product.brand.id,
            name: product.brand.name,
            logoUrl: product.brand.logoUrl,
          }
        : null,
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      },
      retailers: product.retailerProducts.map((rp) => ({
        retailerId: rp.retailer.id,
        retailerName: rp.retailer.name,
        price: rp.price,
        salePrice: rp.salePrice,
        isAvailable: rp.isAvailable,
        isNew: rp.isNew,
      })),
    };
  }
}
