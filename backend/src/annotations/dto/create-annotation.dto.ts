import { IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAnnotationDto {
  @ApiProperty({ description: '文件ID' })
  @IsString()
  fileId: string;

  @ApiProperty({ 
    description: '标注类型', 
    enum: ['focus', 'exclude'],
    example: 'focus'
  })
  @IsEnum(['focus', 'exclude'])
  type: 'focus' | 'exclude';

  @ApiProperty({ description: '标注文本内容' })
  @IsString()
  text: string;

  @ApiProperty({ description: '开始偏移量' })
  @IsNumber()
  @Min(0)
  startOffset: number;

  @ApiProperty({ description: '结束偏移量' })
  @IsNumber()
  @Min(0)
  endOffset: number;

  @ApiProperty({
    description: '标注来源',
    enum: ['manual', 'ai_suggested'],
    default: 'manual'
  })
  @IsOptional()
  @IsEnum(['manual', 'ai_suggested'])
  source?: 'manual' | 'ai_suggested';
}
