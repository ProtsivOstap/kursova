import { RoleEnum } from '../types/user.type';

export class LoginDto {
  email: string;
  password: string;
}

export class SignUpDto {
  role: RoleEnum;
  firstName: string;
  lastName: string;
  password: string;
  supplierInfo?: SupplierAdditionalInfo;
  email: string;
}

export class SupplierAdditionalInfo {
  description: string;
}
