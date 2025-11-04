// src/construction-worker/dto/create-construction-worker.dto.ts
import { IsString, IsInt, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConstructionWorkerDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsInt()
  constructionId?: number | null;
}
