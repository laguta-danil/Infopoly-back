import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: number): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? new UserResponseDto(user) : null;
  }

  async create(email: string, passwordHash: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.create({ data: { email, passwordHash } });
    return new UserResponseDto(user);
  }
}
