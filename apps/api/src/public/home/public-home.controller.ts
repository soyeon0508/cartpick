import { Controller, Get, Param } from '@nestjs/common';
import { PublicHomeService } from './public-home.service';
import { HomeResponseDto } from './dto/home-response.dto';

@Controller('api/v1/countries')
export class PublicHomeController {
  constructor(private readonly publicHomeService: PublicHomeService) {}

  @Get(':countryCode/home')
  async getHome(@Param('countryCode') countryCode: string): Promise<HomeResponseDto> {
    return this.publicHomeService.getHome(countryCode);
  }
}