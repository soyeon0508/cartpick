import { Module } from '@nestjs/common';
import { PublicHomeController } from './public-home.controller';
import { PublicHomeService } from './public-home.service';

@Module({
  controllers: [PublicHomeController],
  providers: [PublicHomeService],
  exports: [PublicHomeService],
})
export class PublicHomeModule {}