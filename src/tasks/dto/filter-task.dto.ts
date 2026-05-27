import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { TaskPriority } from '../../common/enums/task-priority.enum';
import { SortOrder, TaskSortField } from '../../common/enums/task-sort.enum';
import { TaskStatus } from '../../common/enums/task-status.enum';

export class FilterTaskDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: TaskSortField, default: TaskSortField.CreatedAt })
  @IsOptional()
  @IsEnum(TaskSortField)
  sortBy?: TaskSortField;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.Asc })
  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder;
}
