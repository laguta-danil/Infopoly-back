import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import type { Task } from '@prisma/client';
import { TaskPriority } from '../../common/enums/task-priority.enum';
import { TaskStatus } from '../../common/enums/task-status.enum';

@Exclude()
export class TaskResponseDto {
  @Expose() @ApiProperty() id: number;
  @Expose() @ApiProperty() title: string;
  @Expose() @ApiProperty({ enum: TaskStatus }) status: TaskStatus;
  @Expose() @ApiProperty({ enum: TaskPriority }) priority: TaskPriority;
  @Expose() @ApiPropertyOptional({ nullable: true }) dueDate: Date | null;
  @Expose() @ApiProperty() projectId: number;
  @Expose() @ApiProperty() createdAt: Date;
  @Expose() @ApiProperty() updatedAt: Date;

  constructor(task: Task) {
    this.id = task.id;
    this.title = task.title;
    this.status = task.status as TaskStatus;
    this.priority = task.priority as TaskPriority;
    this.dueDate = task.dueDate;
    this.projectId = task.projectId;
    this.createdAt = task.createdAt;
    this.updatedAt = task.updatedAt;
  }
}
