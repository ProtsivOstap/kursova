export class User {
  user_id: number;
  email: string;
  role: RoleEnum;
}

export enum RoleEnum {
  supplier = 'supplier',
  user = 'user',
  admin = 'admin',
}
