import { Controller, Get, Patch, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@CurrentUser() user: any) {
        return this.usersService.getProfile(user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('profile')
    updateProfile(
        @CurrentUser() user: any,
        @Body() dto: { name?: string; username?: string; image?: string },
    ) {
        return this.usersService.updateProfile(user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('change-password')
    changePassword(
        @CurrentUser() user: any,
        @Body() dto: { currentPassword: string; newPassword: string },
    ) {
        return this.usersService.changePassword(user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('account')
    deleteAccount(@CurrentUser() user: any) {
        return this.usersService.deleteAccount(user.id);
    }
}
