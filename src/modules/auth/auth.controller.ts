import { Body, Controller, Get, Headers, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AppError } from '../../shared/app-error';
import { ErrorCodes } from '../../shared/error-codes';

import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { JwtUser } from './types';

@ApiTags('auth')
@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // Keep legacy endpoints at /api/v1/register and /api/v1/login.
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<unknown> {
    return this.auth.register(dto.username, dto.password, dto.email);
  }

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<unknown> {
    return this.auth.login(dto.username, dto.password);
  }

  // Added endpoint for refresh token flow.
  @Post('refresh')
  async refresh(@Body() dto: RefreshDto): Promise<unknown> {
    return this.auth.refresh(dto.refreshToken);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@CurrentUser() user: JwtUser, @Headers('authorization') authorization?: string): Promise<unknown> {
    if (!authorization || !authorization.toLowerCase().startsWith('bearer ')) {
      throw new AppError(ErrorCodes.Unauthorized, '缺少 Bearer Token');
    }
    const token = authorization.slice('bearer '.length).trim();
    await this.auth.logout(user, token);
    return { ok: true };
  }

  // Debug endpoint similar to legacy /api/v1/user/token-info.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('user/token-info')
  async tokenInfo(@Headers('authorization') authorization?: string): Promise<unknown> {
    if (!authorization || !authorization.toLowerCase().startsWith('bearer ')) {
      throw new AppError(ErrorCodes.ParamError, '缺少 Authorization 请求头');
    }
    const token = authorization.slice('bearer '.length).trim();
    return { token, tokenInfo: this.auth.decodeToken(token) };
  }
}
