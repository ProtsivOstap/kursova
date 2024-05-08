import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, SignUpDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() { email, password }: LoginDto) {
    const res = await this.authService.login(email, password);

    return res;
  }

  // @Post('signup')
  // async signIn(@Body() data: SignUpDto) {
  //   return this.authService.signUp(data);
  // }
}
