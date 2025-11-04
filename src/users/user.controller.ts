import { Controller, Get, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.entity';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  createUser(@Body() user: User): User {
    return this.userService.createUser(user);
  }

  @Get()
  getUsers(): User[] {
    return this.userService.getUsers();
  }
}