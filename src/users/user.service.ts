import { Injectable } from '@nestjs/common';
import { User } from './user.entity';

@Injectable()
export class UserService {
  private users: User[] = [];

  createUser(user: User): User {
    this.users.push(user);
    return user;
  }

  getUsers(): User[] {
    return this.users;
  }
}