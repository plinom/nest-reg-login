import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginUserDto, UserProfileDto } from '../users/dto/user.dto';
import { ParseRequest } from '../decorators/parse_request.decorator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { Response } from 'express';
import { UserEmailFromRequestDto } from '../users/dto/user.dto';

@ApiTags('login')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('basic')
  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  @ApiBody({ type: LoginUserDto })
  @ApiOperation({ summary: 'Login JWT strategy' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Mail not confirmed' })
  @ApiResponse({ status: 404, description: 'Permission denied' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiResponse({ status: 200, description: 'Login success' })
  async jwtLogin(@Body() loginUserDto: LoginUserDto, @Res() res: Response) {
    try {
      const { access_token } = await this.authService.loginBasic(loginUserDto);
      return res
        .cookie('access_token', access_token, {
          httpOnly: true,
          secure: false,
          path: '/',
          sameSite: 'lax',
        })
        .send('Login success');
    } catch (err) {
      return res
        .status(err.status)
        .json({ status: err.status, message: err.response });
    }
  }

  @Get('basic/profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Get user profile with' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 404, description: 'Access token not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async jwtGetProfile(
    @ParseRequest() user: UserProfileDto,
    @Res() res: Response,
  ) {
    try {
      return res.send(user);
    } catch (err) {
      return res
        .status(err.status)
        .json({ status: err.status, message: err.response });
    }
  }

  @Get()
  @UseGuards(GoogleOAuthGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Try to login with google provider' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async googleAuth() {}

  @Get('google-redirect')
  @UseGuards(GoogleOAuthGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Login success' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async googleAuthRedirect(
    @ParseRequest() email: UserEmailFromRequestDto,
    @Res() res: Response,
  ) {
    try {
      const { access_token } = await this.authService.loginGoogle(email);
      return res
        .cookie('access_token', access_token, {
          httpOnly: true,
          secure: false,
          path: '/',
          sameSite: 'lax',
        })
        .redirect('http://localhost:3000/profile');
    } catch (err) {
      return res
        .status(err.status)
        .json({ status: err.status, message: err.response });
    }
  }
}
