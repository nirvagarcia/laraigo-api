import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class OptimizedValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: false,
    });

    if (errors.length > 0) {
      const prioritizedError = this.getPrioritizedError(errors);
      throw new BadRequestException({
        message: prioritizedError.message,
        errors: [{
          field: prioritizedError.field,
          message: prioritizedError.message,
        }],
      });
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private getPrioritizedError(errors: any[]): { field: string; message: string } {
    for (const error of errors) {
      if (error.constraints?.whitelistValidation) {
        return {
          field: error.property,
          message: `Property ${error.property} should not exist`,
        };
      }
    }

    for (const error of errors) {
      if (error.constraints?.isNotEmpty) {
        return {
          field: error.property,
          message: error.constraints.isNotEmpty,
        };
      }
      if (error.constraints?.isDefined) {
        return {
          field: error.property,
          message: error.constraints.isDefined,
        };
      }
    }

    for (const error of errors) {
      if (error.constraints?.isString) {
        return {
          field: error.property,
          message: error.constraints.isString,
        };
      }
      if (error.constraints?.isNumber) {
        return {
          field: error.property,
          message: error.constraints.isNumber,
        };
      }
      if (error.constraints?.isBoolean) {
        return {
          field: error.property,
          message: error.constraints.isBoolean,
        };
      }
    }

    for (const error of errors) {
      if (error.constraints?.isEmail) {
        return {
          field: error.property,
          message: error.constraints.isEmail,
        };
      }
      if (error.constraints?.length) {
        return {
          field: error.property,
          message: error.constraints.length,
        };
      }
    }

    const firstError = errors[0];
    const firstConstraintKey = Object.keys(firstError.constraints || {})[0];
    return {
      field: firstError.property,
      message: firstError.constraints?.[firstConstraintKey] || 'Validation failed',
    };
  }
}