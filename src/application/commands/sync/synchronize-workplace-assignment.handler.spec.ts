import { Test, TestingModule } from '@nestjs/testing';
import { SynchronizeWorkplaceAssignmentHandler } from './synchronize-workplace-assignment.handler';
import { Logger } from '@nestjs/common';
import { CrewnetService } from 'src/integration/crewnet/crewnet.service';
import { CamposService } from 'src/integration/campos/campos.service';

describe('SynchronizeWorkplaceAssignmentHandler', () => {
  let handler: SynchronizeWorkplaceAssignmentHandler;

  const camposServiceMock = {
    getAllActiveUnits: jest.fn(),
  };
  const crewnetServiceMock = {
    getAllWorkplaces: jest.fn(),
    workplaceCreate: jest.fn(),
  };
  const loggerMock = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SynchronizeWorkplaceAssignmentHandler,
        { provide: Logger, useValue: loggerMock },
        { provide: CrewnetService, useValue: crewnetServiceMock },
        { provide: CamposService, useValue: camposServiceMock },
      ],
    }).compile();

    handler = module.get<SynchronizeWorkplaceAssignmentHandler>(
      SynchronizeWorkplaceAssignmentHandler,
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
