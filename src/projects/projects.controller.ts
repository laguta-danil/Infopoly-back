import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import {
  ApiAuthErrors,
  ApiResourceConflict,
  ApiResourceNotFound,
} from '../swagger/common-responses';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth('bearer')
@ApiAuthErrors()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a project' })
  @ApiCreatedResponse({ description: 'Project created' })
  @ApiResourceConflict('Project name already exists for this user')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProjectDto) {
    return this.projects.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all projects belonging to the current user' })
  @ApiOkResponse({ description: 'Array of projects ordered by creation date (newest first)' })
  findAll(@CurrentUser('id') userId: number) {
    return this.projects.findAllForUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Project ID' })
  @ApiOkResponse({ description: 'Project found' })
  @ApiResourceNotFound('Project')
  findOne(@Param('id') id: number, @CurrentUser('id') userId: number) {
    return this.projects.findOneForUser(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename a project' })
  @ApiParam({ name: 'id', type: Number, description: 'Project ID' })
  @ApiOkResponse({ description: 'Updated project' })
  @ApiResourceNotFound('Project')
  @ApiResourceConflict('New name already in use by another project of this user')
  update(
    @Param('id') id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projects.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project and all its tasks' })
  @ApiParam({ name: 'id', type: Number, description: 'Project ID' })
  @ApiOkResponse({ description: 'Deleted project' })
  @ApiResourceNotFound('Project')
  remove(@Param('id') id: number, @CurrentUser('id') userId: number) {
    return this.projects.remove(id, userId);
  }
}
