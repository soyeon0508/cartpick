import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class AdminBrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBrandDto) {
    const existing = await this.prisma.brand.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException({ error: 'CONFLICT', message: `Slug '${dto.slug}' is already taken` });

    return this.prisma.brand.create({ data: dto });
  }

  async findAll(q?: string, isActive?: boolean, limit = 20, offset = 0) {
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;
    if (q) where.name = { contains: q, mode: 'insensitive' };

    const [items, totalCount] = await this.prisma.$transaction([
      this.prisma.brand.findMany({ where, orderBy: { name: 'asc' }, take: limit, skip: offset }),
      this.prisma.brand.count({ where }),
    ]);

    return { items, totalCount };
  }

  async findOne(id: number) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundException({ error: 'NOT_FOUND', message: `Brand ${id} not found` });
    return brand;
  }

  async update(id: number, dto: UpdateBrandDto) {
    await this.findOne(id);

    if (dto.slug) {
      const existing = await this.prisma.brand.findUnique({ where: { slug: dto.slug } });
      if (existing && existing.id !== id) {
        throw new ConflictException({ error: 'CONFLICT', message: `Slug '${dto.slug}' is already taken` });
      }
    }

    return this.prisma.brand.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);

    const productCount = await this.prisma.product.count({ where: { brandId: id } });
    if (productCount > 0) {
      throw new ConflictException({ error: 'CONFLICT', message: `Cannot delete brand with ${productCount} associated products` });
    }

    await this.prisma.brand.delete({ where: { id } });
    return { id };
  }
}
