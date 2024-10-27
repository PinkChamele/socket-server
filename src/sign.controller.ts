import { Controller, Get, Query } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Controller('sign')
export class SignController {
  constructor(private readonly jwtService: JwtService) {}

  @Get('token')
  async getToken(@Query('id') id: string) {
    return this.jwtService.signAsync({ id });
  }
}
