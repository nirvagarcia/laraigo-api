import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../logger.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { NotFoundError, ValidationError, DatabaseError } from '../errors/custom-errors';

@Injectable()
export class UserService {
	constructor(
		private prisma: PrismaService,
		private logger: LoggerService,
	) {}

	async create(createUserDto: CreateUserDto) {
		try {
			this.logger.log(`Creating user with name: "${createUserDto.name}"${createUserDto.email ? `, email: "${createUserDto.email}"` : ''}`);
			
			const user = await this.prisma.user.create({ 
				data: { 
					name: createUserDto.name,
					email: createUserDto.email 
				} 
			});
			
			this.logger.log(`User created successfully - ID: ${user.id}, Name: "${user.name}"${user.email ? `, Email: "${user.email}"` : ''}`);
			return user;
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError) {
				this.logger.error(`Database constraint error creating user: ${error.message} - Code: ${error.code}`);
				throw new DatabaseError('Failed to create user due to database constraints');
			}
			this.logger.error(`Unexpected error creating user: ${error.message}`);
			throw new DatabaseError('Failed to create user');
		}
	}

	async findAll() {
		try {
			this.logger.log('Fetching all users from database');
			const users = await this.prisma.user.findMany({
				orderBy: { id: 'asc' }
			});
			this.logger.log(`Successfully retrieved ${users.length} users`);
			return users;
		} catch (error) {
			this.logger.error(`Database error fetching users: ${error.message}`);
			throw new DatabaseError('Failed to fetch users');
		}
	}

	async findOne(id: number) {
		try {
			this.logger.log(`Fetching user with ID: ${id}`);
			
			const user = await this.prisma.user.findUnique({
				where: { id }
			});
			
			if (!user) {
				this.logger.warn(`User with ID ${id} not found in database`);
				throw new NotFoundError(`User with ID ${id} not found`);
			}
			
			this.logger.log(`User found successfully - ID: ${user.id}, Name: "${user.name}"${user.email ? `, Email: "${user.email}"` : ''}`);
			return user;
		} catch (error) {
			if (error instanceof NotFoundError) {
				throw error;
			}
			this.logger.error(`Database error fetching user with ID ${id}: ${error.message}`);
			throw new DatabaseError('Failed to fetch user');
		}
	}

	async update(id: number, updateUserDto: UpdateUserDto) {
		try {
			this.logger.log(`Updating user with ID: ${id} - New data: ${JSON.stringify(updateUserDto)}`);
			
			const existingUser = await this.prisma.user.findUnique({
				where: { id }
			});
			
			if (!existingUser) {
				this.logger.warn(`User with ID ${id} not found for update operation`);
				throw new NotFoundError(`User with ID ${id} not found`);
			}

			const updatedUser = await this.prisma.user.update({
				where: { id },
				data: updateUserDto
			});
			
			this.logger.log(`User updated successfully - ID: ${id}, Name: "${existingUser.name}" -> "${updatedUser.name}"${updatedUser.email ? `, Email: "${updatedUser.email}"` : ''}`);
			return updatedUser;
		} catch (error) {
			if (error instanceof NotFoundError) {
				throw error;
			}
			if (error instanceof PrismaClientKnownRequestError) {
				this.logger.error(`Database constraint error updating user: ${error.message} - Code: ${error.code}`);
				throw new DatabaseError('Failed to update user due to database constraints');
			}
			this.logger.error(`Unexpected error updating user with ID ${id}: ${error.message}`);
			throw new DatabaseError('Failed to update user');
		}
	}

	async remove(id: number) {
		try {
			this.logger.log(`Initiating deletion of user with ID: ${id}`);
			
			const existingUser = await this.prisma.user.findUnique({
				where: { id }
			});
			
			if (!existingUser) {
				this.logger.warn(`User with ID ${id} not found for deletion operation`);
				throw new NotFoundError(`User with ID ${id} not found`);
			}

			await this.prisma.user.delete({
				where: { id }
			});
			
			this.logger.log(`User deleted successfully - ID: ${id}, Name: "${existingUser.name}"${existingUser.email ? `, Email: "${existingUser.email}"` : ''}`);
			return { 
				message: `User with ID ${id} has been deleted successfully`,
				deletedUser: {
					id: existingUser.id,
					name: existingUser.name,
					email: existingUser.email
				}
			};
		} catch (error) {
			if (error instanceof NotFoundError) {
				throw error;
			}
			if (error instanceof PrismaClientKnownRequestError) {
				this.logger.error(`Database constraint error deleting user: ${error.message} - Code: ${error.code}`);
				throw new DatabaseError('Failed to delete user due to database constraints');
			}
			this.logger.error(`Unexpected error deleting user with ID ${id}: ${error.message}`);
			throw new DatabaseError('Failed to delete user');
		}
	}
}