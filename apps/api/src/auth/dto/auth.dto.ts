import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @IsString()
    @IsNotEmpty()
    username!: string;

    @IsString()
    @MinLength(6)
    @IsNotEmpty()
    password!: string;

    @IsString()
    @IsOptional()
    name?: string;
}

export class LoginDto {
    @IsString()
    @IsNotEmpty()
    identifier!: string;

    @IsString()
    @IsNotEmpty()
    password!: string;
}
