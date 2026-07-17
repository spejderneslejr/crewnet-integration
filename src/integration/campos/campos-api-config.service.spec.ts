import { ConfigService } from '@nestjs/config';
import { TestingModule, Test } from '@nestjs/testing';
import { CamposApiConfigService } from './campos-api-config.service';

describe('CamposApiConfigService', () => {
  let service: CamposApiConfigService;
  let config: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CamposApiConfigService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const configValues: Record<string, string> = {
                odoo_hostname: 'https://odoo.example.com',
                odoo_uid: 'odoo_user',
                odoo_password: 'odoo_pass',
                odoo_db: 'db1',
              };
              return configValues[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CamposApiConfigService>(CamposApiConfigService);
    config = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('odooHostname', () => {
    it('should return the correct Odoo hostname', () => {
      expect(service.odooHostname).toBe('https://odoo.example.com');
    });
  });

  describe('odooUID', () => {
    it('should return the correct Odoo UID', () => {
      expect(service.odooUID).toBe('odoo_user');
    });
  });

  describe('odooPassword', () => {
    it('should return the correct Odoo password', () => {
      expect(service.odooPassword).toBe('odoo_pass');
    });
  });

  describe('odooDB', () => {
    it('should return the correct Odoo database name', () => {
      expect(service.odooDB).toBe('db1');
    });
  });
});
