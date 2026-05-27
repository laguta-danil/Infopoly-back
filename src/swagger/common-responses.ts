import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export const ApiAuthErrors = () =>
  applyDecorators(ApiUnauthorizedResponse({ description: 'Missing or invalid token' }));

export const ApiValidationError = () => ApiBadRequestResponse({ description: 'Validation error' });

export const ApiResourceNotFound = (resource: string) =>
  ApiNotFoundResponse({ description: `${resource} not found` });

export const ApiResourceConflict = (description: string) => ApiConflictResponse({ description });
