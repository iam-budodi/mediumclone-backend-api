import { UserEntity } from '@app/user/user.entity';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileResponseInterface } from '@app/profile/types/profileResponse.interface';
import { ProfileType } from '@app/profile/types/profile.type';
import { FollowEntity } from '@app/profile/follow.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(FollowEntity)
    private readonly followRepository: Repository<FollowEntity>,
  ) {}

  async getUserProfile(userId: number, username: string): Promise<ProfileType> {
    const user = await this.userRepository.findOne({ username });
    if (!user)
      throw new HttpException('Profile does not exist!', HttpStatus.NOT_FOUND);

    const follow = await this.followRepository.findOne({
      followerId: userId,
      followingId: user.id,
    });

    return { ...user, following: !!follow };
  }

  async followProfile(userId: number, username: string): Promise<ProfileType> {
    const user = await this.userRepository.findOne({ username });
    if (!user)
      throw new HttpException('Profile does not exist!', HttpStatus.NOT_FOUND);

    if (userId === user.id)
      throw new HttpException(
        'follower and following can not be same person!',
        HttpStatus.FORBIDDEN,
      );

    const follow = await this.followRepository.findOne({
      followerId: userId,
      followingId: user.id,
    });

    if (!follow) {
      const newFollower = new FollowEntity();
      newFollower.followerId = userId;
      newFollower.followingId = user.id;
      await this.followRepository.save(newFollower);
    }

    return { ...user, following: true };
  }

  async unfollowProfile(
    userId: number,
    username: string,
  ): Promise<ProfileType> {
    const user = await this.userRepository.findOne({ username });
    if (!user)
      throw new HttpException('Profile does not exist!', HttpStatus.NOT_FOUND);

    const follow = await this.followRepository.findOne({
      followerId: userId,
      followingId: user.id,
    });

    if (!follow)
      throw new HttpException(
        'You are not following this profile!',
        HttpStatus.NOT_FOUND,
      );

    await this.followRepository.delete(follow);
    return { ...user, following: false };
  }

  async buildProfileResponse(
    profile: ProfileType,
  ): Promise<ProfileResponseInterface> {
    delete profile.email;
    return { profile };
  }
}
