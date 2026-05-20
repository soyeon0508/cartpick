import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRetailerDto } from './dto/create-retailer.dto';
import { UpdateRetailerDto } from './dto/update-retailer.dto';

@Injectable()
export class AdminRetailersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRetailerDto) {
    const existing = await this.prisma.retailer.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException({ error: 'CONFLICT', message: `Slug '${dto.slug}' is already taken` });

    return this.prisma.retailer.create({ data: dto });
  }

  async findAll(countryId?: number, isActive?: boolean) {
    const where: any = {};
    if (countryId) where.countryId = countryId;
    if (isActive !== undefined) where.isActive = isActive;

    return this.prisma.retailer.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: number) {
    const retailer = await this.prisma.retailer.findUnique({ where: { id } });
    if (!retailer) throw new NotFoundException({ error: 'NOT_FOUND', message: `Retailer ${id} not found` });
    return retailer;
  }

  async update(id: number, dto: UpdateRetailerDto) {
    await this.findOne(id);

    if (dto.slug) {
      const existing = await this.prisma.retailer.findUnique({ where: { slug: dto.slug } });
      if (existing && existing.id !== id) {
        throw new ConflictException({ error: 'CONFLICT', message: `Slug '${dto.slug}' is already taken` });
      }
    }

    return this.prisma.retailer.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.retailer.delete({ where: { id } });
    return { id };
  }
}
