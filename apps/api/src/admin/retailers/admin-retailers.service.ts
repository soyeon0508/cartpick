import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRetailerDto } from './dto/create-retailer.dto';
import { UpdateRetailerDto } from './dto/update-retailer.dto';

@Injectable()
export class AdminRetailersService {
  constructor(private prisma: PrismaService) {}

  async create(createRetailerDto: CreateRetailerDto) {
    return this.prisma.retailer.create({
      data: createRetailerDto,
    });
  }

  async findAll(page: number = 1, limit: number = 20, countryId?: string, isActive?: boolean) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (countryId) {
      where.countryId = countryId;
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [items, totalCount] = await Promise.all([
      this.prisma.retailer.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.retailer.count({ where }),
    ]);

    return {
      items,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async findOne(id: number) {
    const retailer = await this.prisma.retailer.findUnique({
      where: { id },
    });

    if (!retailer) {
      throw new NotFoundException(`Retailer with ID ${id} not found`);
    }

    return retailer;
  }

  async update(id: number, updateRetailerDto: UpdateRetailerDto) {
    await this.findOne(id);

    return this.prisma.retailer.update({
      where: { id },
      data: updateRetailerDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.retailer.delete({
      where: { id },
    });
  }
}