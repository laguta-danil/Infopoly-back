import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { TaskPriority } from '../../common/enums/task-priority.enum';
import { TaskStatus } from '../../common/enums/task-status.enum';

export class CreateTaskDto {
  @ApiProperty({ example: 'Design database schema', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.Todo })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.Medium })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: '2025-12-31T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;
}
