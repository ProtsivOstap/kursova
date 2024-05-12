import { Injectable } from '@nestjs/common';
import { pbkdf2Sync } from 'crypto';
import { SignUpDto } from './dto/login.dto';
import { RoleEnum } from './types/user.type';
import { JwtService } from '@nestjs/jwt';
import { DbService } from 'src/db/db.service';

@Injectable()
export class AuthService {
  private readonly salt = 'myConstantSalt';
  constructor(
    private readonly dbService: DbService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const connection = await this.dbService.openConnection('root');
    const possibleUser = (
      await connection.query(`
      SELECT password, role, email, user_id as "userId" from users
      WHERE email='${email}'
    `)
    ).rows[0];
    console.log(`SELECT password, role, email, user_id from users
      WHERE email='${email}'`);

    if (!possibleUser) {
      throw new Error('Wrong email or password');
    }
    await connection.end();
    return this.jwtService.sign({
      userId: possibleUser.userId,
      role: possibleUser.role,
      email: possibleUser.email,
    });
    const hashedPassword = pbkdf2Sync(
      password,
      this.salt,
      10000,
      64,
      'sha256',
    ).toString('hex');

    if (possibleUser[0].password != hashedPassword) {
      throw new Error('Wrong email or password');
    }

    return this.jwtService.sign({
      userId: possibleUser[0].userId,
      role: possibleUser[0].role,
      email: possibleUser[0].email,
    });
  }

  // async signUp({
  //   firstName,
  //   lastName,
  //   password,
  //   role,
  //   supplierInfo,
  //   email,
  // }: SignUpDto) {
  //   const isUserExists = await this.dbService.executeQuery(`
  //       SELECT UserId FROM users WHERE Email = '${email}'
  //   `);
  //   if (isUserExists[0]) {
  //     throw Error(`User with email ${email} already exists`);
  //   }
  //   await this.dbService.executeQuery(`
  //       INSERT INTO users (FirstName, LastName, Role, Password, Email)
  //       VALUES ('${firstName}', '${lastName}', '${role}', '${password}', '${email}');
  //   `);
  //   const createdUser = await this.dbService.executeQuery(`
  //       SELECT UserId, Email, Role FROM users WHERE Email = '${email}'
  //   `);
  //   if (role == RoleEnum.supplier) {
  //     //TODO: autoincrement where needed
  //     const lastInsertedId = await this.dbService.executeQuery(`
  //       select Id from suppliers
  //       order by Id desc
  //       limit 1
  //     `);
  //     await this.dbService.executeQuery(`
  //           INSERT INTO suppliers (Id,Description)
  //           values(${lastInsertedId[0].id + 1}, '${supplierInfo.description}')
  //       `);
  //   }
  //   const accessToken = this.jwtService.sign({
  //     userId: createdUser[0].userId,
  //     role: createdUser[0].role,
  //     email: createdUser[0].email,
  //   });
  //   return { accessToken };
  // }
}
