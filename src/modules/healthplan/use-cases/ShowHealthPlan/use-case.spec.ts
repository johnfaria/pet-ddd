import { Test } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Pet,
  PetSchema,
} from 'src/core/infra/database/mongo/schemas/pet.schema';
import {
  User,
  UserSchema,
} from 'src/core/infra/database/mongo/schemas/user.schema';

import { UserAggregate } from 'src/modules/user/domain/entities/user';
import { UserRepository } from 'src/modules/user/repository/user-repository';
import { IUserRepository } from 'src/modules/user/repository/user-repository.interface';
import { CoreModule } from 'src/core/core.module';
import { NotFoundException } from '@nestjs/common';
import ShowHealthPlanUseCase from './show-health-plan.use-case';
import IHealthPlanRepository from '../../repositories/healplan.repository.interface';
import HealthPlanRepository from '../../repositories/healthplan.repository';
import HealthPlanAggregate from '../../domain/entities/healthplan';
import {
  HealthPlan,
  HealthPlanSchema,
} from 'src/core/infra/database/mongo/schemas/healthplan.schema';

describe('ShowHealthPlanUseCase tests', () => {
  let useCase: ShowHealthPlanUseCase;
  let healthPlanRepository: IHealthPlanRepository;
  let userRepository: IUserRepository;
  let user: UserAggregate;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        CoreModule,
        MongooseModule.forRoot('mongodb://root:example@localhost:27017/'),
        MongooseModule.forFeature([
          { name: Pet.name, schema: PetSchema },
          { name: User.name, schema: UserSchema },
          { name: HealthPlan.name, schema: HealthPlanSchema },
        ]),
      ],
      providers: [
        ShowHealthPlanUseCase,
        {
          provide: 'HealthPlanRepository',
          useClass: HealthPlanRepository,
        },
        {
          provide: 'UserRepository',
          useClass: UserRepository,
        },
      ],
    }).compile();

    useCase = moduleRef.get(ShowHealthPlanUseCase);
    healthPlanRepository = moduleRef.get<IHealthPlanRepository>(
      'HealthPlanRepository',
    );
    userRepository = moduleRef.get<IUserRepository>('UserRepository');

    user = await UserAggregate.createAdmin({
      name: 'Test User Show Health Plan',
      email: 'test_user_show_healthplan@email.com',
      password: 'Test@Password',
    });
    await userRepository.create(user);
  });

  afterEach(async () => {
    await userRepository.delete(user.id);
  });

  it('should show a healthPlan', async () => {
    const healthplan = HealthPlanAggregate.create({
      name: 'Golden Plan',
      description: 'The best plan ever',
      company: 'Golden Health',
      price: 100,
      status: 'active',
    });
    await healthPlanRepository.create(healthplan);
    // Arrange
    const dto = {
      healthPlanId: healthplan.id,
      userId: user.id,
    };
    // Act
    const result = await useCase.execute(dto);
    // Assert
    expect(result).toEqual({
      id: healthplan.id,
      name: healthplan.props.name,
      description: healthplan.props.description,
      company: healthplan.props.company,
      price: healthplan.props.price,
      status: healthplan.props.status,
    });
  });

  it('should throw an error when the pet does not exist', async () => {
    // Arrange
    const fake_healthplan_id = '6639b52364036fcbad08ee9c';
    const dto = {
      healthPlanId: fake_healthplan_id,
      userId: user.id,
    };
    // Act
    // Assert
    await expect(useCase.execute(dto)).rejects.toThrowError(NotFoundException);
  });
});
