import { Test, TestingModule } from '@nestjs/testing';
import { SynchronizeWorkplacesHandler } from './synchronize-workplaces.handler';
import { CamposService } from 'src/integration/campos/campos.service';
import { CrewnetService } from 'src/integration/crewnet/crewnet.service';
import { Logger } from '@nestjs/common';
import { SynchronizeMembersCommand } from './synchronize-members.command';
import e from 'express';

describe('SynchronizeWorkplacesHandler', () => {
  let handler: SynchronizeWorkplacesHandler;

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
        SynchronizeWorkplacesHandler,
        { provide: Logger, useValue: loggerMock },
        { provide: CrewnetService, useValue: crewnetServiceMock },
        { provide: CamposService, useValue: camposServiceMock },
      ],
    }).compile();

    handler = module.get<SynchronizeWorkplacesHandler>(
      SynchronizeWorkplacesHandler,
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute()', () => {
    it('should be defined', () => {
      expect(handler.execute).toBeDefined();
    });

    it('should synchronize workplaces correctly', async () => {
      // Arrange
      const camposUnits = [
        { id: 1, name: 'Unit 1', organization_type: 'Udvalg' },
        { id: 2, name: 'Unit 2', organization_type: 'Team' },
      ];
      const crewnetWorkplaces = [{ id: 10, name: 'Unit 1' }];

      camposServiceMock.getAllActiveUnits.mockResolvedValueOnce(camposUnits);
      crewnetServiceMock.getAllWorkplaces.mockResolvedValueOnce(
        crewnetWorkplaces,
      );

      // Act
      const command = new SynchronizeMembersCommand(false);
      await handler.execute(command);

      // Assert
      expect(camposServiceMock.getAllActiveUnits).toHaveBeenCalled();
      expect(crewnetServiceMock.getAllWorkplaces).toHaveBeenCalled();
      expect(crewnetServiceMock.workplaceCreate).toHaveBeenCalledTimes(1);
      expect(crewnetServiceMock.workplaceCreate).toHaveBeenCalledWith('Unit 2');
    });
  });

  describe('determineWorkplacesToAdd()', () => {
    it('should be defined', () => {
      // @ts-expect-error: access private method for test
      expect(handler.determineWorkplacesToAdd).toBeDefined();
    });

    it('should return workplaces that are in Campos but not in Crewnet', () => {
      // Arrange
      const camposUnits = [
        { id: 1, name: 'Unit 1', organization_type: 'Udvalg' },
        { id: 2, name: 'Unit 2', organization_type: 'Team' },
        { id: 3, name: 'Unit 3', organization_type: 'Arbejdsgruppe' },
      ];
      const crewnetWorkplaces = [{ id: 10, name: 'Unit 1' }];

      // Act
      // @ts-expect-error: access private method for test
      const result = handler.determineWorkplacesToAdd(
        camposUnits,
        crewnetWorkplaces,
      );

      // Assert
      expect(result).toEqual([
        { id: 2, name: 'Unit 2', organization_type: 'Team' },
        { id: 3, name: 'Unit 3', organization_type: 'Arbejdsgruppe' },
      ]);
    });
  });

  describe('addWorkplacesToCrewnet()', () => {
    it('should be defined', () => {
      // @ts-expect-error: access private method for test
      expect(handler.addWorkplacesToCrewnet).toBeDefined();
    });

    it('should add workplaces to Crewnet when not in dry run mode', async () => {
      // Arrange
      const workplacesToAdd = [
        { id: 2, name: 'Unit 2', organization_type: 'Team' },
        { id: 3, name: 'Unit 3', organization_type: 'Arbejdsgruppe' },
      ];

      // Act
      // @ts-expect-error: access private method for test
      await handler.addWorkplacesToCrewnet(workplacesToAdd, false);

      // Assert
      expect(crewnetServiceMock.workplaceCreate).toHaveBeenCalledTimes(2);
      expect(crewnetServiceMock.workplaceCreate).toHaveBeenCalledWith('Unit 2');
      expect(crewnetServiceMock.workplaceCreate).toHaveBeenCalledWith('Unit 3');
    });

    it('should not add workplaces to Crewnet when in dry run mode', async () => {
      // Arrange
      const workplacesToAdd = [
        { id: 2, name: 'Unit 2', organization_type: 'Team' },
      ];

      // Act
      // @ts-expect-error: access private method for test
      await handler.addWorkplacesToCrewnet(workplacesToAdd, true);

      // Assert
      expect(crewnetServiceMock.workplaceCreate).not.toHaveBeenCalled();
    });

    it('should log errors when adding workplaces fails', async () => {
      // Arrange
      const workplacesToAdd = [
        { id: 2, name: 'Unit 2', organization_type: 'Team' },
      ];
      const error = new Error('Failed to create workplace');
      crewnetServiceMock.workplaceCreate.mockRejectedValueOnce(error);

      // Act
      // @ts-expect-error: access private method for test
      await handler.addWorkplacesToCrewnet(workplacesToAdd, false);

      // Assert
      expect(loggerMock.error).toHaveBeenCalledWith(
        'Failed to add workplace: Unit 2',
        error,
      );
    });

    it('should log when adding workplaces in dry run mode', async () => {
      // Arrange
      const workplacesToAdd = [
        { id: 2, name: 'Unit 2', organization_type: 'Team' },
      ];

      // Act
      // @ts-expect-error: access private method for test
      await handler.addWorkplacesToCrewnet(workplacesToAdd, true);

      // Assert
      expect(loggerMock.log).toHaveBeenCalledWith(
        '[Dry Run] Would add workplace: Unit 2',
      );
    });
  });

  describe('warnAboutExtraWorkplaces()', () => {
    it('should be defined', () => {
      // @ts-expect-error: access private method for test
      expect(handler.warnAboutExtraWorkplaces).toBeDefined();
    });

    it('should log extra workplaces that are in Crewnet but not in Campos', () => {
      // Arrange
      const workplaces = [
        { id: 10, name: 'Unit 1' },
        { id: 20, name: 'Unit 2' },
      ];
      const camposUnits = [
        { id: 1, name: 'Unit 1', organization_type: 'Udvalg' },
      ];

      // Act
      // @ts-expect-error: access private method for test
      handler.warnAboutExtraWorkplaces(workplaces, camposUnits);

      // Assert
      expect(loggerMock.warn).toHaveBeenCalledWith(
        'There are 1 workplaces in Crewnet that do not have a corresponding unit in Campos. These will not be removed: Unit 2 (20)',
      );
    });
  });
});
