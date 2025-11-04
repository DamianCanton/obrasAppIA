import { IsNotEmpty, IsString, IsNumber, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateNoteDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    text: string;

    @ApiProperty({ enum: ['architect', 'worker'] })
    @IsString()
    @IsIn(['architect', 'worker'])
    updatedByType: string;

    @ApiProperty()
    @IsNumber()
    updatedBy: number;
}
