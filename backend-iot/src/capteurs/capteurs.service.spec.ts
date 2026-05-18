import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CapteursService } from './capteurs.service';
import { CapteurData } from './entities/capteur-data.entity';
import { Machine } from '../machines/entities/machine.entity';
import { Alerte } from '../alertes/entities/alerte.entity';
import { Seuil } from '../seuils/entities/seuil.entity';
import { EmailsService } from '../emails/emails.service';
import { TempsReelGateway } from '../temps-reel/temps-reel.gateway';

const mockModel = {
  find: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
  findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
  findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
  create: jest.fn().mockResolvedValue({}),
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue([]),
};

describe('CapteursService', () => {
  let service: CapteursService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CapteursService,
        { provide: getModelToken(CapteurData.name), useValue: mockModel },
        { provide: getModelToken(Machine.name), useValue: mockModel },
        { provide: getModelToken(Alerte.name), useValue: mockModel },
        { provide: getModelToken(Seuil.name), useValue: mockModel },
        { provide: EmailsService, useValue: { envoyerAlerteCritique: jest.fn().mockResolvedValue(undefined) } },
        { provide: TempsReelGateway, useValue: { emitToMachine: jest.fn(), emitToAll: jest.fn() } },
      ],
    }).compile();
    service = module.get<CapteursService>(CapteursService);
  });

  it('should be defined', () => { expect(service).toBeDefined(); });
});
