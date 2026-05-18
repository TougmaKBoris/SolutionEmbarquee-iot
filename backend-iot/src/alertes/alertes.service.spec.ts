import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AlertesService } from './alertes.service';
import { Alerte } from './entities/alerte.entity';
import { EvenementsService } from '../evenements/evenements.service';
import { TempsReelGateway } from '../temps-reel/temps-reel.gateway';

describe('AlertesService', () => {
  let service: AlertesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertesService,
        {
          provide: getModelToken(Alerte.name),
          useValue: {
            find: jest.fn().mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }) }) }),
            findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
            findByIdAndUpdate: jest.fn().mockReturnValue({ populate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }) }),
            findByIdAndDelete: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
            deleteMany: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ deletedCount: 0 }) }),
            create: jest.fn().mockResolvedValue({}),
          },
        },
        { provide: EvenementsService, useValue: { creer: jest.fn().mockResolvedValue({}) } },
        { provide: TempsReelGateway, useValue: { emitToMachine: jest.fn(), emitToAll: jest.fn() } },
      ],
    }).compile();
    service = module.get<AlertesService>(AlertesService);
  });

  it('should be defined', () => { expect(service).toBeDefined(); });
});
