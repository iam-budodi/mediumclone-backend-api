import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from '@app/user/dto/createUser.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { UserEntity } from '@app/user/user.entity';
import { JWT_TOKEN } from '@app/config';
import { UserResponseInterface } from '@app/user/types/userResponse.interface';
import { LoginUserDto } from '@app/user/dto/loginUser.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    const userByUserName = await this.userRepository.findOne({
      username: createUserDto.username,
    });
    const userByEmail = await this.userRepository.findOne({
      email: createUserDto.email,
    });

    if (userByEmail || userByUserName) {
      throw new HttpException(
        'username or email is taken',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const newUser = new UserEntity();
    Object.assign(newUser, createUserDto);
    return this.userRepository.save(newUser);
  }

  async userLogin(loginUserDto: LoginUserDto): Promise<UserEntity> {
    const userByEmail = await this.userRepository.findOne({
      email: loginUserDto.email,
    });

    if (!userByEmail) {
      throw new HttpException(
        'Incorrect email, please try again!',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const match = await compare(loginUserDto.password, userByEmail.password);
    if (match) return userByEmail;
    else
      throw new HttpException(
        'Incorrect password, please try again!',
        HttpStatus.UNAUTHORIZED,
      );
  }

  generateJWT(user: UserEntity): string {
    return sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      JWT_TOKEN,
    );
  }

  buildUserResponse(user: UserEntity): UserResponseInterface {
    return {
      user: {
        ...user,
        token: this.generateJWT(user),
      },
    };
  }
}
