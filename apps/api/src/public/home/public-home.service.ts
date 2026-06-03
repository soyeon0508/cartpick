import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductStatus, SectionType } from '@prisma/client';
import { HomeResponseDto } from './dto/home-response.dto';

@Injectable()
export class PublicHomeService {
  constructor(private readonly prisma: PrismaService) {}

  async getHome(countryCode: string): Promise<HomeResponseDto> {
    // Get active home sections for the country
    const homeSections = await this.prisma.homeSection.findMany({
      where: {
        countryCode: countryCode.toUpperCase(),
        isActive: true,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                brand: true,
                retailerProducts: {
                  where: { isAvailable: true },
                },
              },
            },
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    // Resolve sections using resolver pattern
    const sections = await Promise.all(
      homeSections.map((section) => this.resolveSection(section)),
    );

    return {
      countryCode: countryCode.toUpperCase(),
      sections,
    };
  }

  private async resolveSection(section: any): Promise<any> {
    const sectionType = section.sectionType as SectionType;

    switch (sectionType) {
      case SectionType.popular_products:
        return this.resolvePopularProducts(section);
      case SectionType.new_products:
        return this.resolveNewProducts(section);
      case SectionType.top_rated:
        return this.resolveTopRated(section);
      case SectionType.editor_pick:
      case SectionType.custom:
        return this.resolveCustomSection(section);
      default:
        throw new Error(`Unknown section type: ${sectionType}`);
    }
  }

  private async resolvePopularProducts(section: any): Promise<any> {
    // If section has manually curated items, use them
    if (section.items.length > 0) {
      return this.mapSection(section, section.items);
    }

    // Otherwise, auto-resolve: products with most reviews in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const products = await this.prisma.product.findMany({
      where: {
        country: { code: section.countryCode },
        status: ProductStatus.active,
        retailerProducts: { some: { isAvailable: true } },
      },
      include: {
        brand: true,
        retailerProducts: {
          where: { isAvailable: true },
        },
      },
      orderBy: {
        reviewCount: 'desc',
      },
      take: 20,
    });

    return this.mapSection(section, products);
  }

  private async resolveNewProducts(section: any): Promise<any> {
    // If section has manually curated items, use them
    if (section.items.length > 0) {
      return this.mapSection(section, section.items);
    }

    // Otherwise, auto-resolve: recently created products (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const products = await this.prisma.product.findMany({
      where: {
        country: { code: section.countryCode },
        status: ProductStatus.active,
        retailerProducts: { some: { isAvailable: true } },
        createdAt: { gte: thirtyDaysAgo },
      },
      include: {
        brand: true,
        retailerProducts: {
          where: { isAvailable: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    return this.mapSection(section, products);
  }

  private async resolveTopRated(section: any): Promise<any> {
    // If section has manually curated items, use them
    if (section.items.length > 0) {
      return this.mapSection(section, section.items);
    }

    // Otherwise, auto-resolve: products with highest average rating (min 5 reviews)
    const products = await this.prisma.product.findMany({
      where: {
        country: { code: section.countryCode },
        status: ProductStatus.active,
        retailerProducts: { some: { isAvailable: true } },
        reviewCount: { gte: 5 },
      },
      include: {
        brand: true,
        retailerProducts: {
          where: { isAvailable: true },
        },
      },
      orderBy: [
        { averageRating: 'desc' },
        { reviewCount: 'desc' },
      ],
      take: 20,
    });

    return this.mapSection(section, products);
  }

  private async resolveCustomSection(section: any): Promise<any> {
    // Custom sections only use manually curated items
    if (section.items.length === 0) {
      return {
        type: section.sectionType,
        title: section.title,
        subtitle: section.subtitle,
        products: [],
      };
    }

    return this.mapSection(section, section.items);
  }

  private mapSection(section: any, items: any[]): any {
    const products = items.map((item) => {
      // Handle both manual items (with product property) and auto-resolved products
      const product = item.product || item;
      
      // Calculate price range
      const prices = product.retailerProducts
        .map((rp: any) => rp.price)
        .filter((price: number | null) => price !== null && price !== undefined);
      
      const minPrice = prices.length > 0 ? Math.min(...prices) : null;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

      return {
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        averageRating: Number(product.averageRating),
        reviewCount: product.reviewCount,
        minPrice,
        maxPrice,
      };
    });

    return {
      type: section.sectionType,
      title: section.title,
      subtitle: section.subtitle,
      products,
    };
  }
}