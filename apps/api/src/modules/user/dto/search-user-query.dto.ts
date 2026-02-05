import { IsOptional, IsString } from 'class-validator';

import { PageQueryDto } from './page-query.dto';

export class SearchUserQueryDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;
}

