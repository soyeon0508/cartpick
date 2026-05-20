import { Module } from '@nestjs/common';
import { AdminRetailersService } from './admin-retailers.service';
import { AdminRetailersController } from './admin-retailers.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminRetailersController],
  providers: [AdminRetailersService],
  exports: [AdminRetailersService],
})
export class AdminRetailersModule {}