import { Controller, Post } from '@nestjs/common';
import { UserService } from '@app/user/user.service';

@Controller()
export class UserController {
  constructor(private readonly useService: UserService) {}

  @Post('users')
  async createUser(): Promise<any> {
    return this.useService.createUser();
  }
}
