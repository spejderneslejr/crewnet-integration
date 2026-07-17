import { TestingModule, Test } from '@nestjs/testing';
import { CrewnetApiConfigService } from './crewnet-api-config.service';
import { ConfigService } from '@nestjs/config';

describe('CrewnetApiConfigService', () => {
  let service: CrewnetApiConfigService;
  let config: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrewnetApiConfigService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const configValues: Record<string, string> = {
                crewnet_apidomain: 'https://localhost:9999',
                crewnet_event_id: 'event123',
                crewnet_token: 'token123',
              };
              return configValues[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CrewnetApiConfigService>(CrewnetApiConfigService);
    config = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('crewnetApiDomain', () => {
    it('should return the correct API domain', () => {
      expect(service.crewnetApiDomain).toBe('https://localhost:9999');
    });
  });

  describe('crewnetApiBasePath', () => {
    it('should return the correct API base path', () => {
      expect(service.crewnetApiBasePath).toBe('https://localhost:9999/v1');
    });

    it('should handle domains without http/https', () => {
      jest.spyOn(config, 'get').mockReturnValueOnce('localhost:9999');
      expect(service.crewnetApiBasePath).toBe('https://localhost:9999/v1');
    });
  });

  describe('crewnetEventId', () => {
    it('should return the correct event ID', () => {
      expect(service.crewnetEventId).toBe('event123');
    });
  });

  describe('crewnetToken', () => {
    it('should return the correct token', () => {
      expect(service.crewnetToken).toBe('token123');
    });
  });
});
