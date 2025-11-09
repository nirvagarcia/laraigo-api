import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
	canActivate(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest();
		const authHeader = request.headers.authorization;
		
		console.log('🔍 [JwtAuthGuard] Authorization header:', authHeader);
		
		if (authHeader) {
			const token = authHeader.replace('Bearer ', '');
			console.log('🔍 [JwtAuthGuard] Extracted token (first 20 chars):', token.substring(0, 20) + '...');
		}
		
		return super.canActivate(context);
	}
}