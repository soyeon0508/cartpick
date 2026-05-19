import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class SignupDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @MaxLength(255, { message: 'Email must be at most 255 characters' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(100, { message: 'Password must be at most 100 characters' })
  password!: string;

  @IsString()
  @MinLength(2, { message: 'Nickname must be at least 2 characters' })
  @MaxLength(30, { message: 'Nickname must be at most 30 characters' })
  @Matches(/^[가-힣a-zA-Z0-9_]+$/, {
    message: 'Nickname can only contain Korean, English letters, numbers, and underscores',
  })
  nickname!: string;
}
