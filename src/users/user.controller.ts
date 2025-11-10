import { 
  Controller, 
  Get, 
  Put,
  Patch, 
  Delete, 
  Param, 
  Body, 
  UseGuards, 
  ForbiddenException,
  ParseIntPipe
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { UserSession } from '../auth/auth.types';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async findAll() {
    return this.userService.findAll();
  }

  @Get('me')
  async getProfile(@GetUser() user: UserSession) {
    return this.userService.findOne(user.userId);
  }

  @Put('me')
  async updateOwnProfile(@GetUser() user: UserSession, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(user.userId, updateUserDto);
  }

  @Delete('me')
  async removeOwn(@GetUser() user: UserSession) {
    return this.userService.remove(user.userId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('USER', 'ADMIN')
  async findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: UserSession) {
    if (user.role !== 'ADMIN' && user.userId !== id) {
      throw new ForbiddenException('You can only access your own profile');
    }

    return this.userService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('USER', 'ADMIN')
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() user: UserSession
  ) {
    if (user.role !== 'ADMIN' && user.userId !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    return this.userService.update(id, updateUserDto);
  }

  @Patch(':id/change-password')
  @UseGuards(RolesGuard)
  @Roles('USER', 'ADMIN')
  async changePassword(
    @Param('id', ParseIntPipe) id: number, 
    @Body() changePasswordDto: ChangePasswordDto,
    @GetUser() user: UserSession
  ) {
    if (user.role !== 'ADMIN' && user.userId !== id) {
      throw new ForbiddenException('You can only change your own password');
    }

    return this.userService.changePassword(id, changePasswordDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('USER', 'ADMIN')
  async remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: UserSession) {
    if (user.role !== 'ADMIN' && user.userId !== id) {
      throw new ForbiddenException('You can only delete your own account');
    }

    return this.userService.remove(id);
  }
}