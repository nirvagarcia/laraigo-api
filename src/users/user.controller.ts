import { Controller, Post, Body, Get, Param, Put, Delete, ParseIntPipe, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { UserService } from './user.service';
import { LoggerService } from '../logger.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async create(@Body() createUserDto: CreateUserDto, @Req() req: Request) {
    const clientIp = req.ip || req.connection.remoteAddress;
    this.logger.log(`API POST /users - Creating user "${createUserDto.name}"${createUserDto.email ? `, email: "${createUserDto.email}"` : ''} - IP: ${clientIp} - User-Agent: ${req.headers['user-agent']}`);
    
    const result = await this.userService.create(createUserDto);
    
    this.logger.log(`API POST /users - Success - User created with ID: ${result.id} - IP: ${clientIp}`);
    return result;
  }

  @Get()
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  async findAll(@Req() req: Request) {
    const clientIp = req.ip || req.connection.remoteAddress;
    this.logger.log(`API GET /users - Fetching all users - IP: ${clientIp}`);
    
    const result = await this.userService.findAll();
    
    this.logger.log(`API GET /users - Success - Retrieved ${result.length} users - IP: ${clientIp}`);
    return result;
  }

  @Get(':id')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const clientIp = req.ip || req.connection.remoteAddress;
    this.logger.log(`API GET /users/${id} - Fetching user - IP: ${clientIp}`);
    
    const result = await this.userService.findOne(id);
    
    this.logger.log(`API GET /users/${id} - Success - User found: "${result.name}" - IP: ${clientIp}`);
    return result;
  }

  @Put(':id')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto, @Req() req: Request) {
    const clientIp = req.ip || req.connection.remoteAddress;
    this.logger.log(`API PUT /users/${id} - Updating user with data: ${JSON.stringify(updateUserDto)} - IP: ${clientIp}`);
    
    const result = await this.userService.update(id, updateUserDto);
    
    this.logger.log(`API PUT /users/${id} - Success - User updated to: "${result.name}" - IP: ${clientIp}`);
    return result;
  }

  @Delete(':id')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const clientIp = req.ip || req.connection.remoteAddress;
    this.logger.log(`API DELETE /users/${id} - Deleting user - IP: ${clientIp}`);
    
    const result = await this.userService.remove(id);
    
    this.logger.log(`API DELETE /users/${id} - Success - User deleted - IP: ${clientIp}`);
    return result;
  }
}