import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import type { MeResponseData, UserListData } from '@go-practice/shared';

import { Roles } from '../../shared/authz/roles.decorator';
import { RolesGuard } from '../../shared/authz/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtUser } from '../auth/types';

import { PageQueryDto } from './dto/page-query.dto';
import { SearchUserQueryDto } from './dto/search-user-query.dto';
import { UserService } from './user.service';

@ApiTags('user')
@Controller()
export class UserController {
  constructor(private readonly users: UserService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('user/me')
  async me(@CurrentUser() user: JwtUser): Promise<MeResponseData> {
    return { id: user.userId, username: user.username, role: user.role };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'operator')
  @Get('users')
  async list(@Query() q: PageQueryDto): Promise<UserListData> {
    return this.users.getUserList(q.page, q.pageSize);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'operator')
  @Get('users/search')
  async search(@Query() q: SearchUserQueryDto): Promise<UserListData> {
    return this.users.searchUsers(q.keyword, q.page, q.pageSize);
  }
}
