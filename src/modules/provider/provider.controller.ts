import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { ProviderService } from './provider.service';

@ApiTags('provider')
@Controller('provider')
export class ProviderController {
  constructor(private readonly provider: ProviderService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('summary')
  async summary(): Promise<unknown> {
    return this.provider.getSummary();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async stats(): Promise<unknown> {
    return this.provider.getStats();
  }
}

