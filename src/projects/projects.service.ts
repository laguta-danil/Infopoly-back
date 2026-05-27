import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForUser(userId: number): Promise<ProjectResponseDto[]> {
    const projects = await this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return projects.map((p) => new ProjectResponseDto(p));
  }

  async findOneForUser(id: number, userId: number): Promise<ProjectResponseDto> {
    const project = await this.prisma.project.findFirst({ where: { id, userId } });
    if (!project) throw new NotFoundException(`Project #${id} not found`);
    return new ProjectResponseDto(project);
  }

  async create(userId: number, dto: CreateProjectDto): Promise<ProjectResponseDto> {
    const exists = await this.prisma.project.findFirst({
      where: { userId, name: dto.name },
      select: { id: true },
    });
    if (exists) throw new ConflictException('Project name already exists');

    const project = await this.prisma.project.create({ data: { name: dto.name, userId } });
    return new ProjectResponseDto(project);
  }

  async update(id: number, userId: number, dto: UpdateProjectDto): Promise<ProjectResponseDto> {
    await this.assertOwnership(id, userId);

    if (dto.name) {
      const conflict = await this.prisma.project.findFirst({
        where: { userId, name: dto.name, NOT: { id } },
        select: { id: true },
      });
      if (conflict) throw new ConflictException('Project name already exists');
    }

    const project = await this.prisma.project.update({ where: { id }, data: dto });
    return new ProjectResponseDto(project);
  }

  async remove(id: number, userId: number): Promise<ProjectResponseDto> {
    await this.assertOwnership(id, userId);
    const project = await this.prisma.project.delete({ where: { id } });
    return new ProjectResponseDto(project);
  }

  async assertOwnership(id: number, userId: number): Promise<void> {
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!project) throw new NotFoundException(`Project #${id} not found`);
  }
}
