import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../auth/admin-auth.module';
import { AdminRetailersController } from './admin-retailers.controller';
import { AdminRetailersService } from './admin-retailers.service';

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminRetailersController],
  providers: [AdminRetailersService],
})
export class AdminRetailersModule {}