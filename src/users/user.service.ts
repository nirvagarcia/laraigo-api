import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
	constructor(private prisma: PrismaService) {}

	async create(createUserDto: CreateUserDto) {
		return this.prisma.user.create({ 
			data: { 
				name: createUserDto.name,
				email: createUserDto.email,
				passwordHash: 'temp_hash'
			} 
		});
	}

	async findAll() {
		return this.prisma.user.findMany({
			orderBy: { id: 'desc' }
		});
	}

	async findOne(id: number) {
		return this.prisma.user.findUnique({
			where: { id }
		});
	}

	async update(id: number, updateUserDto: UpdateUserDto) {
		return this.prisma.user.update({
			where: { id },
			data: updateUserDto
		});
	}

	async remove(id: number) {
		return this.prisma.user.delete({
			where: { id }
		});
	}
}