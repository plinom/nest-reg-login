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
import { ParseRequest } from '../utils/decorators/parse-request.decorator';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from 'src/utils/guards/local-auth.guard';
import { GoogleOAuthGuard } from 'src/utils/guards/google-oauth.guard';
import { Response } from 'express';
import { LoginUserDto } from 'src/utils/dto/login.dto';
import { ConfigService } from '@nestjs/config';

@ApiTags('authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('basic')
  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  @ApiBody({ type: LoginUserDto })
  @ApiOperation({ summary: 'Login JWT strategy' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Mail not confirmed' })
  @ApiResponse({ status: 404, description: 'Email or password incorrected' })
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

  @Get('google')
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
    @ParseRequest() email: string,
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
        .redirect(
          this.configService
            .get<string>('CLIENT_ORIGIN')
            .concat(this.configService.get<string>('CLIENT_TO_PROFILE')),
        );
    } catch (err) {
      return res.redirect(
        this.configService
          .get<string>('CLIENT_ORIGIN')
          .concat(this.configService.get<string>('CLIENT_TO_REGISTRATE')),
      );
    }
  }
}
