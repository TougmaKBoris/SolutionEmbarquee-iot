import { Test, TestingModule } from '@nestjs/testing';
import { SeuilsService } from './seuils.service';

describe('SeuilsService', () => {
  let service: SeuilsService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ providers: [SeuilsService] }).compile();
    service = module.get<SeuilsService>(SeuilsService);
  });
  it('should be defined', () => { expect(service).toBeDefined(); });
});
