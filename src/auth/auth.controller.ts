import { 
	Controller, 
	Post, 
	Body, 
	HttpStatus, 
	HttpCode, 
	UseGuards,
	Request
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	@HttpCode(HttpStatus.CREATED)
	async register(@Body() registerDto: RegisterDto) {
		const result = await this.authService.register(registerDto);
		return {
			message: 'User registered successfully',
			user: {
				id: result.user.id,
				name: result.user.name,
				email: result.user.email,
				role: result.user.role
			},
			accessToken: result.accessToken,
			refreshToken: result.refreshToken
		};
	}

	@Post('login')
	@HttpCode(HttpStatus.OK)
	async login(@Body() loginDto: LoginDto) {
		const result = await this.authService.login(loginDto);
		return {
			message: 'Login successful',
			user: {
				id: result.user.id,
				name: result.user.name,
				email: result.user.email,
				role: result.user.role
			},
			accessToken: result.accessToken,
			refreshToken: result.refreshToken
		};
	}

	@Post('refresh')
	@HttpCode(HttpStatus.OK)
	async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
		const result = await this.authService.refreshTokens(refreshTokenDto.refreshToken);
		return {
			message: 'Tokens refreshed successfully',
			accessToken: result.accessToken,
			refreshToken: result.refreshToken
		};
	}

	@Post('logout')
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.OK)
	async logout(@Request() req) {
		console.log('🔍 [AuthController] Logout request for user:', req.user);
		await this.authService.logout(req.user);
		return {
			message: 'Logout successful'
		};
	}
}