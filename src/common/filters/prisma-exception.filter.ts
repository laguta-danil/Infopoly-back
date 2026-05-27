import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const httpException = this.toHttpException(exception);

    if (httpException.getStatus() >= 500) {
      this.logger.error(
        `Unhandled Prisma error ${exception.code}: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.debug(`Prisma error ${exception.code} mapped to ${httpException.getStatus()}`);
    }

    response.status(httpException.getStatus()).json(httpException.getResponse());
  }

  private toHttpException(exception: Prisma.PrismaClientKnownRequestError): HttpException {
    switch (exception.code) {
      case 'P2002':
        return new ConflictException('Resource already exists');
      case 'P2025':
        return new NotFoundException('Resource not found');
      case 'P2003':
        return new BadRequestException('Related resource not found');
      default:
        return new InternalServerErrorException();
    }
  }
}
