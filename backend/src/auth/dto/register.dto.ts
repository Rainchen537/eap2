import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: '邮箱地址' })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @ApiProperty({ description: '密码', minLength: 6, maxLength: 50 })
  @IsString()
  @MinLength(6, { message: '密码长度至少6位' })
  @MaxLength(50, { message: '密码长度不能超过50位' })
  password: string;

  @ApiProperty({ description: '姓', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiProperty({ description: '名', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;
}
