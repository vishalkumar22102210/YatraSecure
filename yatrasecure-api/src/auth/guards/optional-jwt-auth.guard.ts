import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Call the parent canActivate to attempt JWT validation
    return super.canActivate(context);
  }

  // Override handleRequest so it doesn't throw on missing/invalid token
  handleRequest(err: any, user: any) {
    // If there's no user or an error, just return null (no auth, that's fine)
    if (err || !user) {
      return null;
    }
    return user;
  }
}