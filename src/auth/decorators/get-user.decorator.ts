import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserSession } from '../auth.types';

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserSession => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);