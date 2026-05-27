import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import type { Project } from '@prisma/client';

@Exclude()
export class ProjectResponseDto {
  @Expose() @ApiProperty() id: number;
  @Expose() @ApiProperty() name: string;
  @Expose() @ApiProperty() createdAt: Date;
  @Expose() @ApiProperty() updatedAt: Date;

  constructor(project: Project) {
    this.id = project.id;
    this.name = project.name;
    this.createdAt = project.createdAt;
    this.updatedAt = project.updatedAt;
  }
}
