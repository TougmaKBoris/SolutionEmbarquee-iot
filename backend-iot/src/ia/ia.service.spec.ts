import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { IaService } from './ia.service';
import { Alerte } from '../alertes/entities/alerte.entity';
import { CapteurData } from '../capteurs/entities/capteur-data.entity';
import { Machine } from '../machines/entities/machine.entity';
import { Seuil } from '../seuils/entities/seuil.entity';

const mockModel = {
  find: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]), sort: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), populate: jest.fn().mockReturnThis() }),
  findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
};

describe('IaService', () => {
  let service: IaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IaService,
        { provide: getModelToken(Alerte.name), useValue: mockModel },
        { provide: getModelToken(CapteurData.name), useValue: mockModel },
        { provide: getModelToken(Machine.name), useValue: mockModel },
        { provide: getModelToken(Seuil.name), useValue: mockModel },
      ],
    }).compile();
    service = module.get<IaService>(IaService);
  });

  it('should be defined', () => { expect(service).toBeDefined(); });
});
