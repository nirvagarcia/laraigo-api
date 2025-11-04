import { Controller, Post, Body, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.entity';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() body: { name: string }): Promise<User> {
    return this.userService.create(body.name);
  }

  @Get()
  findAll(): Promise<User[]> {
    return this.userService.findAll();
  }
}