import { Test, TestingModule } from '@nestjs/testing';
import { AffectationsService } from './affectations.service';

describe('AffectationsService', () => {
  let service: AffectationsService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ providers: [AffectationsService] }).compile();
    service = module.get<AffectationsService>(AffectationsService);
  });
  it('should be defined', () => { expect(service).toBeDefined(); });
});
