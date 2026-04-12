import { Test, TestingModule } from '@nestjs/testing';
import { CapteursService } from './capteurs.service';

describe('CapteursService', () => {
  let service: CapteursService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ providers: [CapteursService] }).compile();
    service = module.get<CapteursService>(CapteursService);
  });
  it('should be defined', () => { expect(service).toBeDefined(); });
});
