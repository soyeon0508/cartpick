import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class AdminCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException({ error: 'CONFLICT', message: `Slug '${dto.slug}' is already taken` });

    const depth = dto.parentId ? 1 : 0;

    return this.prisma.category.create({ data: { ...dto, depth } });
  }

  async findAll(countryId?: number, parentId?: number, isActive?: boolean) {
    const where: any = {};
    if (countryId) where.countryId = countryId;
    if (parentId !== undefined) where.parentId = parentId;
    if (isActive !== undefined) where.isActive = isActive;

    return this.prisma.category.findMany({
      where,
      orderBy: [{ countryId: 'asc' }, { displayOrder: 'asc' }, { name: 'asc' }],
      include: { parent: { select: { id: true, name: true } } },
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { parent: { select: { id: true, name: true } }, children: { select: { id: true, name: true } } },
    });
    if (!category) throw new NotFoundException({ error: 'NOT_FOUND', message: `Category ${id} not found` });
    return category;
  }

  async update(id: number, dto: UpdateCategoryDto) {
    await this.findOne(id);

    if (dto.slug) {
      const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
      if (existing && existing.id !== id) {
        throw new ConflictException({ error: 'CONFLICT', message: `Slug '${dto.slug}' is already taken` });
      }
    }

    const updateData: any = { ...dto };
    if (dto.parentId !== undefined) {
      updateData.depth = dto.parentId ? 1 : 0;
    }

    return this.prisma.category.update({ where: { id }, data: updateData });
  }

  async remove(id: number) {
    await this.findOne(id);

    const productCount = await this.prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      throw new ConflictException({ error: 'CONFLICT', message: `Cannot delete category with ${productCount} associated products` });
    }

    const childCount = await this.prisma.category.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new ConflictException({ error: 'CONFLICT', message: `Cannot delete category that has ${childCount} child categories` });
    }

    await this.prisma.category.delete({ where: { id } });
    return { id };
  }
}
