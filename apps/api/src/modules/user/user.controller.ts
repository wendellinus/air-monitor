import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import type { CityItem, MeResponseData, UserListData } from '@air-monitor/shared';
import type { DashboardLayoutData } from '@air-monitor/shared';
import type { MeProfileData } from '@air-monitor/shared';

import { Permissions } from '../../shared/authz/permissions.decorator';
import { PermissionsGuard } from '../../shared/authz/permissions.guard';
import { Roles } from '../../shared/authz/roles.decorator';
import { RolesGuard } from '../../shared/authz/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtUser } from '../auth/types';

import { PageQueryDto } from './dto/page-query.dto';
import { SearchUserQueryDto } from './dto/search-user-query.dto';
import { FavoriteCityDto } from './dto/favorite-city.dto';
import { FavoriteCityParamDto } from './dto/favorite-city-param.dto';
import { UpdateLocaleDto } from './dto/update-locale.dto';
import { UpdateDashboardLayoutDto } from './dto/update-dashboard-layout.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { UserService } from './user.service';

@ApiTags('user')
@Controller()
export class UserController {
  constructor(private readonly users: UserService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('user/me')
  async me(@CurrentUser() user: JwtUser): Promise<MeResponseData> {
    return this.users.getMe(user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('user/me/profile')
  async getMyProfile(@CurrentUser() user: JwtUser): Promise<MeProfileData> {
    return this.users.getMyProfile(user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('user/me/profile')
  async updateMyProfile(
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateMyProfileDto,
  ): Promise<MeProfileData> {
    return this.users.updateMyProfile(user.userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('user/me/locale')
  async updateMyLocale(
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateLocaleDto,
  ): Promise<MeResponseData> {
    return this.users.updateLocale(user.userId, dto.locale);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('user/me/dashboard-layout')
  async getMyDashboardLayout(@CurrentUser() user: JwtUser): Promise<DashboardLayoutData> {
    return this.users.getDashboardLayout(user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('user/me/dashboard-layout')
  async updateMyDashboardLayout(
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateDashboardLayoutDto,
  ): Promise<DashboardLayoutData> {
    return this.users.updateDashboardLayout(user.userId, dto.layout);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('user/favorites/cities')
  async listFavoriteCities(@CurrentUser() user: JwtUser): Promise<CityItem[]> {
    return this.users.getFavoriteCities(user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('user/favorites/cities')
  async addFavoriteCity(
    @CurrentUser() user: JwtUser,
    @Body() dto: FavoriteCityDto,
  ): Promise<unknown> {
    await this.users.addFavoriteCity(user.userId, dto);
    return { ok: true };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('user/favorites/cities/:cityId')
  async removeFavoriteCity(
    @CurrentUser() user: JwtUser,
    @Param() dto: FavoriteCityParamDto,
  ): Promise<unknown> {
    await this.users.removeFavoriteCity(user.userId, dto.cityId);
    return { ok: true };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'operator')
  @Permissions('users.view')
  @Get('users')
  async list(@Query() q: PageQueryDto): Promise<UserListData> {
    return this.users.getUserList(q.page, q.pageSize);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'operator')
  @Permissions('users.view')
  @Get('users/search')
  async search(@Query() q: SearchUserQueryDto): Promise<UserListData> {
    return this.users.searchUsers(q.keyword, q.page, q.pageSize);
  }
}
