import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AffectationsService } from './affectations.service';
import { Affectation } from './entities/affectation.entity';

describe('AffectationsService', () => {
  let service: AffectationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AffectationsService,
        {
          provide: getModelToken(Affectation.name),
          useValue: {
            find: jest.fn().mockReturnValue({ populate: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([]) }),
            findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null), populate: jest.fn().mockReturnThis() }),
            findByIdAndDelete: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
            create: jest.fn().mockResolvedValue({ populate: jest.fn().mockResolvedValue({}) }),
            deleteMany: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
          },
        },
      ],
    }).compile();
    service = module.get<AffectationsService>(AffectationsService);
  });

  it('should be defined', () => { expect(service).toBeDefined(); });
});
