import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TaskPriority } from '../common/enums/task-priority.enum';
import { SortOrder, TaskSortField } from '../common/enums/task-sort.enum';
import { TaskStatus } from '../common/enums/task-status.enum';
import { ApiAuthErrors, ApiResourceNotFound } from '../swagger/common-responses';
import { CreateTaskDto } from './dto/create-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth('bearer')
@ApiAuthErrors()
@ApiParam({ name: 'projectId', type: Number, description: 'Project ID' })
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a task inside a project' })
  @ApiCreatedResponse({ description: 'Task created' })
  @ApiResourceNotFound('Project')
  create(
    @Param('projectId') projectId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasks.create(projectId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List tasks with optional filtering and sorting' })
  @ApiOkResponse({ description: 'Array of tasks matching the given filters' })
  @ApiResourceNotFound('Project')
  @ApiQuery({ name: 'status', enum: TaskStatus, required: false, description: 'Filter by status' })
  @ApiQuery({
    name: 'priority',
    enum: TaskPriority,
    required: false,
    description: 'Filter by priority',
  })
  @ApiQuery({
    name: 'sortBy',
    enum: TaskSortField,
    required: false,
    description: 'Field to sort by',
  })
  @ApiQuery({ name: 'order', enum: SortOrder, required: false, description: 'Sort direction' })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: 'Page number, starting from 1',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Items per page (max 100)',
  })
  findAll(
    @Param('projectId') projectId: number,
    @CurrentUser('id') userId: number,
    @Query() filter: FilterTaskDto,
  ) {
    return this.tasks.findAll(projectId, userId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Task ID' })
  @ApiOkResponse({ description: 'Task found' })
  @ApiResourceNotFound('Task or project')
  findOne(
    @Param('id') id: number,
    @Param('projectId') projectId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.tasks.findOne(id, projectId, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task fields (partial update)' })
  @ApiParam({ name: 'id', type: Number, description: 'Task ID' })
  @ApiOkResponse({ description: 'Updated task' })
  @ApiResourceNotFound('Task or project')
  update(
    @Param('id') id: number,
    @Param('projectId') projectId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasks.update(id, projectId, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'id', type: Number, description: 'Task ID' })
  @ApiOkResponse({ description: 'Deleted task' })
  @ApiResourceNotFound('Task or project')
  remove(
    @Param('id') id: number,
    @Param('projectId') projectId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.tasks.remove(id, projectId, userId);
  }
}
