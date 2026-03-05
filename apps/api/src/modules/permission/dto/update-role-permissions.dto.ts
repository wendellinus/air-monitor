import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayUnique, IsArray, IsString, MaxLength } from 'class-validator';

export class UpdateRolePermissionsDto {
  @Type(() => String)
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  permissionKeys!: string[];
}
