import "reflect-metadata";
import { IsEmail, IsString, MinLength, MaxLength, Matches } from "class-validator";

export class RegisterDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name!: string;

    // Official police service/badge ID
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    policeId!: string;

    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(6, { message: "Password must be at least 6 characters" })
    password!: string;

    @IsString()
    @Matches(/^[0-9+\-\s]{7,20}$/, { message: "Contact must be a valid phone number" })
    contact!: string;
}

export class LoginDto {
    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(1)
    password!: string;
}