import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { MachinesService } from './machines.service';
import { Machine } from './entities/machine.entity';
import { Actionneur } from '../actionneurs/entities/actionneur.entity';
import { Seuil } from '../seuils/entities/seuil.entity';
import { Alerte } from '../alertes/entities/alerte.entity';
import { Affectation } from '../affectations/entities/affectation.entity';
import { CapteurData } from '../capteurs/entities/capteur-data.entity';
import { Evenement } from '../evenements/entities/evenement.entity';
import { MachineSupprimee } from '../common/initialisation/machine-supprimee.schema';
import { EvenementsService } from '../evenements/evenements.service';
import { TempsReelGateway } from '../temps-reel/temps-reel.gateway';
import { MqttService } from '../mqtt/mqtt.service';

const mockModel = {
  find: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
  findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
  findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
  findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
  findByIdAndDelete: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
  create: jest.fn().mockResolvedValue({}),
  deleteMany: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
  updateMany: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
  updateOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
};

describe('MachinesService', () => {
  let service: MachinesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MachinesService,
        { provide: getModelToken(Machine.name), useValue: mockModel },
        { provide: getModelToken(Actionneur.name), useValue: mockModel },
        { provide: getModelToken(Seuil.name), useValue: mockModel },
        { provide: getModelToken(Alerte.name), useValue: mockModel },
        { provide: getModelToken(Affectation.name), useValue: mockModel },
        { provide: getModelToken(CapteurData.name), useValue: mockModel },
        { provide: getModelToken(Evenement.name), useValue: mockModel },
        { provide: getModelToken(MachineSupprimee.name), useValue: mockModel },
        { provide: EvenementsService, useValue: { creer: jest.fn().mockResolvedValue({}) } },
        { provide: TempsReelGateway, useValue: { emitToMachine: jest.fn(), emitToAll: jest.fn() } },
        { provide: MqttService, useValue: { publishEtatMachine: jest.fn().mockResolvedValue(true), publishCommande: jest.fn().mockResolvedValue(true) } },
      ],
    }).compile();
    service = module.get<MachinesService>(MachinesService);
  });

  it('should be defined', () => { expect(service).toBeDefined(); });
});
