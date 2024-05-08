import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { DbService } from 'src/db/db.service';
import { User } from '../types/user.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly dbService: DbService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'yourSecretKey',
    });
  }

  async validate(payload: any): Promise<User> {
    const connection = await this.dbService.openConnection('root');
    const user = await connection.query(`
        SELECT password, role, email, user_id from users
        where user_id = ${payload.userId}
    `);
    if (!user.rows[0]) {
      throw new UnauthorizedException();
    }
    return user.rows[0];
  }
}
