import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { MissingStatus } from '../../shared/entities/missing.entity';

export class UpdateMissingStatusDto {
  @IsEnum(MissingStatus)
  status: MissingStatus;

  @IsOptional()
  @IsInt()
  actorId?: number;

  @IsOptional()
  @IsString()
  @IsIn(['ARCHITECT', 'WORKER', 'ADMIN'])
  actorRole?: 'ARCHITECT' | 'WORKER' | 'ADMIN';
}
