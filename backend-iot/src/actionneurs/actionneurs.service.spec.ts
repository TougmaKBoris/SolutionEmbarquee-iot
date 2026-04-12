import { Test, TestingModule } from '@nestjs/testing';
import { ActionneursService } from './actionneurs.service';

describe('ActionneursService', () => {
  let service: ActionneursService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ providers: [ActionneursService] }).compile();
    service = module.get<ActionneursService>(ActionneursService);
  });
  it('should be defined', () => { expect(service).toBeDefined(); });
});
