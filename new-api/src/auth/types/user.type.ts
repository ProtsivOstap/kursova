export class User {
  UserId: number;
  Email: string;
  Role: RoleEnum;
}

export enum RoleEnum {
  supplier = 'supplier',
  user = 'user',
  admin = 'admin',
}
