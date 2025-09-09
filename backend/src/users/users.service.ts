import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  async findAll(page = 1, limit = 10): Promise<{ users: User[]; total: number }> {
    const [users, total] = await this.userRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { users, total };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['userPlans', 'apiKeys'],
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async getUserStats(userId: string): Promise<{
    totalFiles: number;
    totalAnnotations: number;
    totalQuizzes: number;
    totalAttempts: number;
  }> {
    const stats = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.files', 'file')
      .leftJoin('user.annotations', 'annotation')
      .leftJoin('user.quizzes', 'quiz')
      .leftJoin('user.quizAttempts', 'attempt')
      .select([
        'COUNT(DISTINCT file.id) as totalFiles',
        'COUNT(DISTINCT annotation.id) as totalAnnotations',
        'COUNT(DISTINCT quiz.id) as totalQuizzes',
        'COUNT(DISTINCT attempt.id) as totalAttempts',
      ])
      .where('user.id = :userId', { userId })
      .getRawOne();

    return {
      totalFiles: parseInt(stats.totalFiles) || 0,
      totalAnnotations: parseInt(stats.totalAnnotations) || 0,
      totalQuizzes: parseInt(stats.totalQuizzes) || 0,
      totalAttempts: parseInt(stats.totalAttempts) || 0,
    };
  }
}
