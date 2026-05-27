import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import type { User } from '@prisma/client';

@Exclude()
export class UserResponseDto {
  @Expose() @ApiProperty() id: number;
  @Expose() @ApiProperty() email: string;
  @Expose() @ApiProperty() createdAt: Date;
  @Expose() @ApiProperty() updatedAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
