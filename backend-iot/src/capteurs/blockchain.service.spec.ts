import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import * as crypto from 'crypto';
import { Types } from 'mongoose';
import { BlockchainService } from './blockchain.service';
import { CapteurData } from './entities/capteur-data.entity';

const GENESIS_HASH = '0'.repeat(64);

const makeMockModel = (overrides: Partial<any> = {}) => ({
  findOne: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(null),
  }),
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  }),
  distinct: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
  create: jest.fn().mockResolvedValue({}),
  ...overrides,
});

describe('BlockchainService', () => {
  let service: BlockchainService;
  let mockModel: ReturnType<typeof makeMockModel>;

  beforeEach(async () => {
    mockModel = makeMockModel();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainService,
        { provide: getModelToken(CapteurData.name), useValue: mockModel },
      ],
    }).compile();
    service = module.get<BlockchainService>(BlockchainService);
  });

  it('should be defined', () => { expect(service).toBeDefined(); });

  describe('calculerHash', () => {
    it('produit un hash SHA-256 de 64 caracteres hexadecimaux', () => {
      const hash = service.calculerHash('mid', 'temperature', 83.2, 'C', new Date('2026-01-01T10:00:00Z'), GENESIS_HASH);
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('est deterministe', () => {
      const ts = new Date('2026-01-01T10:00:00Z');
      const h1 = service.calculerHash('mid', 'temperature', 83.2, 'C', ts, GENESIS_HASH);
      const h2 = service.calculerHash('mid', 'temperature', 83.2, 'C', ts, GENESIS_HASH);
      expect(h1).toBe(h2);
    });

    it('change si la valeur change', () => {
      const ts = new Date('2026-01-01T10:00:00Z');
      const h1 = service.calculerHash('mid', 'temperature', 83.2, 'C', ts, GENESIS_HASH);
      const h2 = service.calculerHash('mid', 'temperature', 84.0, 'C', ts, GENESIS_HASH);
      expect(h1).not.toBe(h2);
    });

    it('change si hash_precedent change', () => {
      const ts = new Date('2026-01-01T10:00:00Z');
      const h1 = service.calculerHash('mid', 'temperature', 83.2, 'C', ts, GENESIS_HASH);
      const h2 = service.calculerHash('mid', 'temperature', 83.2, 'C', ts, 'a'.repeat(64));
      expect(h1).not.toBe(h2);
    });

    it('correspond au SHA-256 calcule manuellement', () => {
      const ts = new Date('2026-06-09T08:00:00.000Z');
      const contenu = JSON.stringify({ machineId: 'abc', type: 'courant', valeur: 5.1, unite: 'A', timestamp: ts.toISOString(), hashPrecedent: GENESIS_HASH });
      const attendu = crypto.createHash('sha256').update(contenu).digest('hex');
      expect(service.calculerHash('abc', 'courant', 5.1, 'A', ts, GENESIS_HASH)).toBe(attendu);
    });
  });

  describe('obtenirDernierHash', () => {
    it('retourne le hash genesis si aucun bloc en DB', async () => {
      expect(await service.obtenirDernierHash(new Types.ObjectId().toString(), 'temperature')).toBe(GENESIS_HASH);
    });

    it('retourne le hash genesis pour un machineId invalide', async () => {
      expect(await service.obtenirDernierHash('invalide', 'temperature')).toBe(GENESIS_HASH);
    });

    it('retourne hash_propre du dernier document en DB', async () => {
      const hashAttendu = 'f'.repeat(64);
      mockModel.findOne.mockReturnValue({ sort: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue({ hash_propre: hashAttendu }) });
      expect(await service.obtenirDernierHash(new Types.ObjectId().toString(), 'temperature')).toBe(hashAttendu);
    });
  });

  describe('enregistrerAvecHash', () => {
    it('appelle create avec hash_precedent genesis et hash_propre valide', async () => {
      const machineId = new Types.ObjectId();
      const ts = new Date('2026-06-09T08:00:00Z');
      await service.enregistrerAvecHash(machineId, 'temperature', 83.2, 'C', ts);
      const args = mockModel.create.mock.calls[0][0];
      expect(args.machine_id).toEqual(machineId);
      expect(args.hash_precedent).toBe(GENESIS_HASH);
      expect(args.hash_propre).toHaveLength(64);
      expect(args.hash_propre).toMatch(/^[0-9a-f]{64}$/);
    });

    it('hash_propre est coherent avec calculerHash', async () => {
      const machineId = new Types.ObjectId();
      const ts = new Date('2026-06-09T08:00:00Z');
      await service.enregistrerAvecHash(machineId, 'pression', 4.8, 'bar', ts);
      const args = mockModel.create.mock.calls[0][0];
      expect(args.hash_propre).toBe(service.calculerHash(machineId.toString(), 'pression', 4.8, 'bar', ts, GENESIS_HASH));
    });
  });

  describe('verifierChaine', () => {
    it('retourne valide=false pour un machineId invalide', async () => {
      const res = await service.verifierChaine('invalide', 'temperature');
      expect(res.valide).toBe(false);
    });

    it('retourne valide=true et blocs=0 si aucun document en DB', async () => {
      const res = await service.verifierChaine(new Types.ObjectId().toString(), 'temperature');
      expect(res.valide).toBe(true);
      expect(res.blocs).toBe(0);
    });

    it('valide une chaine de 3 blocs correctement chaines', async () => {
      const mid = new Types.ObjectId().toString();
      const ts = (n: number) => new Date(1000000 + n * 10000);
      const h0 = service.calculerHash(mid, 'temperature', 75.0, 'C', ts(0), GENESIS_HASH);
      const h1 = service.calculerHash(mid, 'temperature', 76.5, 'C', ts(1), h0);
      const h2 = service.calculerHash(mid, 'temperature', 78.0, 'C', ts(2), h1);
      mockModel.find.mockReturnValue({ sort: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([
        { _id: new Types.ObjectId(), type: 'temperature', valeur: 75.0, unite: 'C', timestamp: ts(0), hash_precedent: GENESIS_HASH, hash_propre: h0 },
        { _id: new Types.ObjectId(), type: 'temperature', valeur: 76.5, unite: 'C', timestamp: ts(1), hash_precedent: h0, hash_propre: h1 },
        { _id: new Types.ObjectId(), type: 'temperature', valeur: 78.0, unite: 'C', timestamp: ts(2), hash_precedent: h1, hash_propre: h2 },
      ]) });
      const res = await service.verifierChaine(mid, 'temperature');
      expect(res.valide).toBe(true);
      expect(res.blocs).toBe(3);
      expect(res.erreurs).toHaveLength(0);
    });

    it('detecte une valeur modifiee dans un bloc', async () => {
      const mid = new Types.ObjectId().toString();
      mockModel.find.mockReturnValue({ sort: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([
        { _id: new Types.ObjectId(), type: 'temperature', valeur: 75.0, unite: 'C', timestamp: new Date(1000000), hash_precedent: GENESIS_HASH, hash_propre: 'hash_falsifie' },
      ]) });
      const res = await service.verifierChaine(mid, 'temperature');
      expect(res.valide).toBe(false);
      expect(res.erreurs[0].raison).toContain('hash_propre invalide');
    });

    it('detecte une rupture de chaine entre deux blocs', async () => {
      const mid = new Types.ObjectId().toString();
      const ts = (n: number) => new Date(1000000 + n * 10000);
      const h0 = service.calculerHash(mid, 'temperature', 75.0, 'C', ts(0), GENESIS_HASH);
      const faux = 'b'.repeat(64);
      const h1 = service.calculerHash(mid, 'temperature', 76.5, 'C', ts(1), faux);
      mockModel.find.mockReturnValue({ sort: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([
        { _id: new Types.ObjectId(), type: 'temperature', valeur: 75.0, unite: 'C', timestamp: ts(0), hash_precedent: GENESIS_HASH, hash_propre: h0 },
        { _id: new Types.ObjectId(), type: 'temperature', valeur: 76.5, unite: 'C', timestamp: ts(1), hash_precedent: faux, hash_propre: h1 },
      ]) });
      const res = await service.verifierChaine(mid, 'temperature');
      expect(res.valide).toBe(false);
      expect(res.erreurs[0].raison).toContain('rompue');
    });
  });

  describe('statsBlockchain', () => {
    it('retourne capteurs=[] pour un machineId invalide', async () => {
      expect((await service.statsBlockchain('invalide')).capteurs).toEqual([]);
    });

    it('retourne capteurs=[] si aucun capteur avec hash en DB', async () => {
      expect((await service.statsBlockchain(new Types.ObjectId().toString())).capteurs).toEqual([]);
    });
  });
});
