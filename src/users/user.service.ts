import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectPinoLogger(UserService.name)
    private readonly logger: PinoLogger,
    private prisma: PrismaService,
  ) {}

  /** Get all users (ADMIN only) */
  async findAll() {
    this.logger.info(
      { event: 'USER_FIND_ALL', module: 'UserService' },
      'Fetching all users'
    );
    
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    
    this.logger.info(
      { event: 'USER_FIND_ALL_SUCCESS', module: 'UserService', count: users.length },
      'Successfully fetched users'
    );
    
    return users;
  }

  /** Get user by ID */
  async findOne(id: number) {
    this.logger.info(
      { event: 'USER_FIND_ONE', module: 'UserService', userId: id },
      'Fetching user by ID'
    );
    
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      this.logger.warn(
        { event: 'USER_NOT_FOUND', module: 'UserService', userId: id },
        'User not found'
      );
      throw new NotFoundException('User not found');
    }
    
    this.logger.info(
      { event: 'USER_FIND_ONE_SUCCESS', module: 'UserService', userId: id },
      'Successfully fetched user'
    );

    return user;
  }

  /** Update user profile */
  async update(id: number, updateUserDto: UpdateUserDto) {
    this.logger.info(
      { event: 'USER_UPDATE', module: 'UserService', userId: id, metadata: updateUserDto },
      'Updating user'
    );
    
    const user = await this.prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      this.logger.warn(
        { event: 'USER_NOT_FOUND', module: 'UserService', userId: id },
        'User not found for update'
      );
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    this.logger.info(
      { event: 'USER_UPDATE_SUCCESS', module: 'UserService', userId: id },
      'Successfully updated user'
    );
    
    return updatedUser;
  }

  /** Change user password */
  async changePassword(id: number, changePasswordDto: ChangePasswordDto) {
    this.logger.info(
      { event: 'USER_PASSWORD_CHANGE', module: 'UserService', userId: id },
      'Attempting password change'
    );
    
    const user = await this.prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      this.logger.warn(
        { event: 'USER_NOT_FOUND', module: 'UserService', userId: id },
        'User not found for password change'
      );
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      this.logger.warn(
        { event: 'USER_PASSWORD_INVALID', module: 'UserService', userId: id },
        'Invalid current password provided'
      );
      throw new ForbiddenException('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: newPasswordHash }
    });
    
    this.logger.info(
      { event: 'USER_PASSWORD_CHANGE_SUCCESS', module: 'UserService', userId: id },
      'Password changed successfully'
    );

    return { message: 'Password changed successfully' };
  }

  /** Delete user */
  async remove(id: number) {
    this.logger.info(
      { event: 'USER_DELETE', module: 'UserService', userId: id },
      'Attempting to delete user'
    );
    
    const user = await this.prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      this.logger.warn(
        { event: 'USER_NOT_FOUND', module: 'UserService', userId: id },
        'User not found for deletion'
      );
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id }
    });
    
    this.logger.info(
      { event: 'USER_DELETE_SUCCESS', module: 'UserService', userId: id },
      'User deleted successfully'
    );

    return { message: 'User deleted successfully' };
  }
}