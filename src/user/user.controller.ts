import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from '@app/user/user.service';
import { CreateUserDto } from '@app/user/dto/createUser.dto';

@Controller()
export class UserController {
  constructor(private readonly useService: UserService) {}

  @Post('users')
  async createUser(
    @Body('user') createUserDto: CreateUserDto,
  ): Promise<CreateUserDto> {
    return this.useService.createUser(createUserDto);
  }
}
