import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginatedResponse } from '../common/dto/paginated-response.dto';
import { TaskPriority } from '../common/enums/task-priority.enum';
import { SortOrder, TaskSortField } from '../common/enums/task-sort.enum';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  [TaskPriority.Low]: 0,
  [TaskPriority.Medium]: 1,
  [TaskPriority.High]: 2,
};

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
  ) {}

  async findAll(
    projectId: number,
    userId: number,
    filter: FilterTaskDto,
  ): Promise<PaginatedResponse<TaskResponseDto>> {
    await this.projects.assertOwnership(projectId, userId);

    const where: Prisma.TaskWhereInput = { projectId };
    if (filter.status) where.status = filter.status;
    if (filter.priority) where.priority = filter.priority;

    const sortBy = filter.sortBy ?? TaskSortField.CreatedAt;
    const order = filter.order ?? SortOrder.Asc;

    if (sortBy === TaskSortField.Priority) {
      // Priority needs custom ordering (low<medium<high), so fetch all matching
      // rows and sort in memory. Pagination is then applied after sorting.
      const allTasks = await this.prisma.task.findMany({ where });
      allTasks.sort((a, b) => {
        const diff =
          PRIORITY_WEIGHT[a.priority as TaskPriority] - PRIORITY_WEIGHT[b.priority as TaskPriority];
        return order === SortOrder.Asc ? diff : -diff;
      });
      const paged = allTasks.slice(filter.skip, filter.skip + filter.limit);
      return new PaginatedResponse(
        paged.map((t) => new TaskResponseDto(t)),
        allTasks.length,
        filter.page,
        filter.limit,
      );
    }

    const [tasks, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        orderBy: { [sortBy]: order },
        skip: filter.skip,
        take: filter.limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return new PaginatedResponse(
      tasks.map((t) => new TaskResponseDto(t)),
      total,
      filter.page,
      filter.limit,
    );
  }

  async findOne(id: number, projectId: number, userId: number): Promise<TaskResponseDto> {
    await this.projects.assertOwnership(projectId, userId);
    const task = await this.prisma.task.findFirst({ where: { id, projectId } });
    if (!task) throw new NotFoundException(`Task #${id} not found`);
    return new TaskResponseDto(task);
  }

  async create(projectId: number, userId: number, dto: CreateTaskDto): Promise<TaskResponseDto> {
    await this.projects.assertOwnership(projectId, userId);
    const task = await this.prisma.task.create({ data: { ...dto, projectId } });
    return new TaskResponseDto(task);
  }

  async update(
    id: number,
    projectId: number,
    userId: number,
    dto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    await this.assertTaskExists(id, projectId, userId);
    const task = await this.prisma.task.update({ where: { id }, data: dto });
    return new TaskResponseDto(task);
  }

  async remove(id: number, projectId: number, userId: number): Promise<TaskResponseDto> {
    await this.assertTaskExists(id, projectId, userId);
    const task = await this.prisma.task.delete({ where: { id } });
    return new TaskResponseDto(task);
  }

  private async assertTaskExists(id: number, projectId: number, userId: number): Promise<void> {
    await this.projects.assertOwnership(projectId, userId);
    const task = await this.prisma.task.findFirst({
      where: { id, projectId },
      select: { id: true },
    });
    if (!task) throw new NotFoundException(`Task #${id} not found`);
  }
}
