import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SuggestAnnotationsDto {
  @ApiProperty({
    description: '文件ID',
    example: 'uuid-string',
  })
  @IsUUID()
  fileId: string;
}
