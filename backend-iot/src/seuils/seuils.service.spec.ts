import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SeuilsService } from './seuils.service';
import { Seuil } from './entities/seuil.entity';

describe('SeuilsService', () => {
  let service: SeuilsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeuilsService,
        {
          provide: getModelToken(Seuil.name),
          useValue: {
            find: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
            findOneAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
          },
        },
      ],
    }).compile();
    service = module.get<SeuilsService>(SeuilsService);
  });

  it('should be defined', () => { expect(service).toBeDefined(); });
});
