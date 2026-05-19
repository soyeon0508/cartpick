import { Module } from '@nestjs/common';
import { UserMeService } from './user-me.service';
import { UserMeController } from './user-me.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserMeController],
  providers: [UserMeService],
  exports: [UserMeService],
})
export class UserMeModule {}