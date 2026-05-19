import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../strategies/user-jwt.strategy';

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext): AuthenticatedUser | any => {
    const req = ctx.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>();
    const user = req.user;
    
    return data ? user[data] : user;
  },
);
