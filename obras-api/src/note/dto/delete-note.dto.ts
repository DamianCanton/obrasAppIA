import { IsString, IsNumber, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteNoteDto {
  @ApiProperty({ enum: ['architect', 'worker'] })
  @IsString()
  @IsIn(['architect', 'worker'])
  deletedByType: string;

  @ApiProperty()
  @IsNumber()
  deletedBy: number;
}
