import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class AdminBrandsService {
  constructor(private prisma: PrismaService) {}

  async create(createBrandDto: CreateBrandDto) {
    // Generate slug from name
    const slug = createBrandDto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    return this.prisma.brand.create({
      data: {
        ...createBrandDto,
        slug,
      },
    });
  }

  async findAll(page: number = 1, limit: number = 20, isActive?: boolean) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [items, totalCount] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.brand.count({ where }),
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
    const brand = await this.prisma.brand.findUnique({
      where: { id },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    return brand;
  }

  async update(id: number, updateBrandDto: UpdateBrandDto) {
    // Check if brand exists
    await this.findOne(id);

    // Update slug if name is being updated
    const updateData: any = { ...updateBrandDto };
    if (updateBrandDto.name) {
      updateData.slug = updateBrandDto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    return this.prisma.brand.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number) {
    // Check if brand exists
    await this.findOne(id);

    return this.prisma.brand.delete({
      where: { id },
    });
  }
}