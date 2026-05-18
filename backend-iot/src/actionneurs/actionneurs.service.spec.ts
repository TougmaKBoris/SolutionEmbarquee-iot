import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ActionneursService } from './actionneurs.service';
import { Actionneur } from './entities/actionneur.entity';
import { Machine } from '../machines/entities/machine.entity';
import { EvenementsService } from '../evenements/evenements.service';
import { TempsReelGateway } from '../temps-reel/temps-reel.gateway';
import { MqttService } from '../mqtt/mqtt.service';

const mockModel = {
  find: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
  findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
  findOneAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
};

describe('ActionneursService', () => {
  let service: ActionneursService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActionneursService,
        { provide: getModelToken(Actionneur.name), useValue: mockModel },
        { provide: getModelToken(Machine.name), useValue: mockModel },
        { provide: EvenementsService, useValue: { creer: jest.fn().mockResolvedValue({}) } },
        { provide: TempsReelGateway, useValue: { emitToMachine: jest.fn(), emitToAll: jest.fn() } },
        { provide: MqttService, useValue: { publishCommande: jest.fn().mockResolvedValue(true) } },
      ],
    }).compile();
    service = module.get<ActionneursService>(ActionneursService);
  });

  it('should be defined', () => { expect(service).toBeDefined(); });
});
