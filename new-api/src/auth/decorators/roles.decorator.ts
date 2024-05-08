import { SetMetadata } from '@nestjs/common';
import { RoleEnum } from '../types/user.type';

export const Roles = (...roles: RoleEnum[]) => SetMetadata('roles', roles);
