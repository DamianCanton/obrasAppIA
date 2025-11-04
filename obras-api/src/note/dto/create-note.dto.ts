import { IsNotEmpty, IsString, IsNumber, IsIn, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNoteDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty()
  @IsInt()
  elementId: number;

  @ApiProperty({ enum: ['architect', 'worker'] })
  @IsString()
  @IsIn(['architect', 'worker'])
  createdByType: string;

  @ApiProperty()
  @IsNumber()
  createdBy: number;
}
