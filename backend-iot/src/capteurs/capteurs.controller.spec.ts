import { Test, TestingModule } from '@nestjs/testing';
import { CapteursController } from './capteurs.controller';
import { CapteursService } from './capteurs.service';
import { BlockchainService } from './blockchain.service';

describe('CapteursController', () => {
  let controller: CapteursController;

  const mockCapteursService = {
    getLive: jest.fn().mockReturnValue([]),
    getLiveByMachine: jest.fn().mockResolvedValue({ machine_id: 'id', capteurs: [] }),
    getHistorique: jest.fn().mockResolvedValue([]),
    getHistoriqueByType: jest.fn().mockResolvedValue([]),
  };

  const mockBlockchainService = {
    verifierChaine: jest.fn().mockResolvedValue({ valide: true, blocs: 0, erreurs: [] }),
    statsBlockchain: jest.fn().mockResolvedValue({ capteurs: [] }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CapteursController],
      providers: [
        { provide: CapteursService, useValue: mockCapteursService },
        { provide: BlockchainService, useValue: mockBlockchainService },
      ],
    }).compile();
    controller = module.get<CapteursController>(CapteursController);
  });

  it('should be defined', () => { expect(controller).toBeDefined(); });
});
