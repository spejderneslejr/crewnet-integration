import { Test, TestingModule } from '@nestjs/testing';
import {
  CamposService,
  CamposUserResult,
} from 'src/integration/campos/campos.service';
import { SynchronizeMembersHandler } from './synchronize-members.handler';
import {
  CrewnetService,
  UserCreate,
} from 'src/integration/crewnet/crewnet.service';
import { Logger } from '@nestjs/common';
import { SynchronizeMembersCommand } from './synchronize-members.command';

const CAMPOS_MEMBER_1: CamposUserResult = Object.freeze({
  id: 123,
  name: 'John Doe',
  member_number: 123,
  birthdate: '2000-01-01',
});

describe('SynchronizeMembersHandler', () => {
  let handler: SynchronizeMembersHandler;

  const camposServiceMock = {
    getAllActiveMembers: jest.fn(),
  };
  const crewnetServiceMock = {
    getAllMembers: jest.fn(),
    userCreate: jest.fn(),
    userUpdate: jest.fn(),
  };
  const loggerMock = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SynchronizeMembersHandler,
        { provide: Logger, useValue: loggerMock },
        { provide: CrewnetService, useValue: crewnetServiceMock },
        { provide: CamposService, useValue: camposServiceMock },
      ],
    }).compile();

    handler = module.get<SynchronizeMembersHandler>(SynchronizeMembersHandler);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute()', () => {
    it('should be defined', () => {
      expect(handler.execute).toBeDefined();
    });

    it('should synchronize members between Campos and Crewnet', async () => {
      // Arrange
      const camposMembers: CamposUserResult[] = [CAMPOS_MEMBER_1];
      const crewnetMembers = [];
      camposServiceMock.getAllActiveMembers.mockResolvedValue(camposMembers);
      crewnetServiceMock.getAllMembers.mockResolvedValue(crewnetMembers);

      // Act
      const command = new SynchronizeMembersCommand(false);
      await handler.execute(command);

      // Assert
      expect(camposServiceMock.getAllActiveMembers).toHaveBeenCalled();
      expect(crewnetServiceMock.getAllMembers).toHaveBeenCalled();
      expect(crewnetServiceMock.userCreate).toHaveBeenCalledWith({
        first_name: 'John',
        last_name: 'Doe',
        birthday: '2000-01-01',
        email: '123@crewnet.sl2026.dk',
      });
      expect(crewnetServiceMock.userUpdate).toHaveBeenCalledWith(
        expect.any(Number),
        {
          first_name: 'John',
          last_name: 'Doe',
          birthday: '2000-01-01',
          email: '123@crewnet.sl2026.dk',
        },
      );
    });
  });

  describe('determineUsersToAdd()', () => {
    it('should be defined', () => {
      // @ts-expect-error: access private method for test
      expect(handler.determineUsersToAdd).toBeDefined();
    });

    describe('when there are no members in either system', () => {
      it('should return an empty list', () => {
        // @ts-expect-error: access private method for test
        const result = handler.determineUsersToAdd([], []);
        expect(result).toEqual([]);
      });
    });

    describe('when there are members in Campos but not in Crewnet', () => {
      // Arrange
      const camposMembers: CamposUserResult[] = [CAMPOS_MEMBER_1];
      const crewnetMembers = [];

      it('should return the list of members to add to Crewnet', () => {
        // Act
        // @ts-expect-error: access private method for test
        const result = handler.determineUsersToAdd(
          camposMembers,
          crewnetMembers,
        );

        // Assert
        expect(result.length).toBe(1);
      });

      it('should map Campos members to Crewnet CreateUser model', () => {
        // Act
        // @ts-expect-error: access private method for test
        const result = handler.determineUsersToAdd(
          camposMembers,
          crewnetMembers,
        );

        // Assert
        expect(result[0]).toEqual({
          first_name: 'John',
          last_name: 'Doe',
          birthday: '2000-01-01',
          email: '123@crewnet.sl2026.dk',
        });
      });
    });
  });

  describe('mapCamposUserToCrewnetUser()', () => {
    it('should be defined', () => {
      // @ts-expect-error: access private method for test
      expect(handler.mapCamposUserToCrewnetUser).toBeDefined();
    });

    it('should map Campos user to Crewnet user format', () => {
      // @ts-expect-error: access private method for test
      const crewnetUser = handler.mapCamposUserToCrewnetUser(CAMPOS_MEMBER_1);
      expect(crewnetUser).toEqual({
        first_name: 'John',
        last_name: 'Doe',
        birthday: '2000-01-01',
        email: '123@crewnet.sl2026.dk',
      });
    });
  });

  describe('splitName()', () => {
    it('should be defined', () => {
      // @ts-expect-error: access private method for test
      expect(handler.splitName).toBeDefined();
    });

    it('should split full name into first name and last name', () => {
      // @ts-expect-error: access private method for test
      const result = handler.splitName('John Doe');
      expect(result).toEqual({ firstName: 'John', lastName: 'Doe' });
    });

    it('should handle names with multiple parts', () => {
      // @ts-expect-error: access private method for test
      const result = handler.splitName('John Michael Doe');
      expect(result).toEqual({ firstName: 'John Michael', lastName: 'Doe' });
    });

    it('should handle names with extra spaces', () => {
      // @ts-expect-error: access private method for test
      const result = handler.splitName('  John   Doe  ');
      expect(result).toEqual({ firstName: 'John', lastName: 'Doe' });
    });

    it('should handle single word names', () => {
      // @ts-expect-error: access private method for test
      const result = handler.splitName('Madonna');
      expect(result).toEqual({ firstName: '', lastName: 'Madonna' });
    });

    it('should handle empty names', () => {
      // @ts-expect-error: access private method for test
      const result = handler.splitName('');
      expect(result).toEqual({ firstName: '', lastName: '' });
    });
  });

  describe('addMembersToCrewnet()', () => {
    // Arrange
    const membersToAdd: UserCreate[] = [
      {
        first_name: 'John',
        last_name: 'Doe',
        birthday: '2000-01-01',
        email: '123@crewnet.sl2026.dk',
      },
    ];
    crewnetServiceMock.userCreate.mockResolvedValue(456);

    it('should be defined', () => {
      // @ts-expect-error: access private method for test
      expect(handler.addMembersToCrewnet).toBeDefined();
    });

    it('should add members to Crewnet when not in dry run mode', async () => {
      // Act
      // @ts-expect-error: access private method for test
      await handler.addMembersToCrewnet(membersToAdd, false);

      // Assert
      expect(crewnetServiceMock.userCreate).toHaveBeenCalledWith(
        membersToAdd[0],
      );
      expect(crewnetServiceMock.userUpdate).toHaveBeenCalledWith(
        expect.any(Number),
        {
          first_name: 'John',
          last_name: 'Doe',
          birthday: '2000-01-01',
          email: '123@crewnet.sl2026.dk',
        },
      );
    });

    it('should not add members to Crewnet when in dry run mode', async () => {
      // @ts-expect-error: access private method for test
      await handler.addMembersToCrewnet(membersToAdd, true);
      expect(crewnetServiceMock.userCreate).not.toHaveBeenCalled();
    });

    it('should log when adding members in dry run mode', async () => {
      // @ts-expect-error: access private method for test
      await handler.addMembersToCrewnet(membersToAdd, true);
      expect(loggerMock.log).toHaveBeenCalledWith(
        `[Dry Run] Would add member 'John Doe (123@crewnet.sl2026.dk)' to Crewnet.`,
      );
    });

    it('should log errors when failing to add members', async () => {
      // Arrange
      const error = new Error('Failed to create user');
      crewnetServiceMock.userCreate.mockRejectedValueOnce(error);

      // Act
      // @ts-expect-error: access private method for test
      await handler.addMembersToCrewnet(membersToAdd, false);

      // Assert
      expect(loggerMock.error).toHaveBeenCalledWith(
        `Failed to add member 'John Doe (123@crewnet.sl2026.dk)' to Crewnet: Failed to create user`,
      );
    });

    it('should limit the number of members added in one run', async () => {
      // Arrange
      const MAX_MEMBERS_TO_ADD = 10;
      const manyMembers: UserCreate[] = [];
      for (let i = 0; i < MAX_MEMBERS_TO_ADD + 10; i++) {
        manyMembers.push({
          first_name: `John${i}`,
          last_name: `Doe${i}`,
          birthday: '2000-01-01',
          email: `123${i}@crewnet.sl2026.dk`,
        });
      }

      // Act
      // @ts-expect-error: access private method for test
      await handler.addMembersToCrewnet(manyMembers, false, MAX_MEMBERS_TO_ADD);

      // Assert
      expect(crewnetServiceMock.userCreate).toHaveBeenCalledTimes(
        MAX_MEMBERS_TO_ADD,
      );
    });
  });
});
