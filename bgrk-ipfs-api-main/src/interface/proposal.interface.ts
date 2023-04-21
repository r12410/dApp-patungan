import { ApiProperty } from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

export class Proposal {
    @ApiProperty({
        type: String,
        description: 'Required property',
        example: ""
    })
    @IsNotEmpty()
    description: string;

    @ApiProperty({
        type: Array,
        description: 'Required property',
        example: ['0x0000000000000000000000000000000000000000'],
    })
    @IsNotEmpty()
    signers: string[];
}