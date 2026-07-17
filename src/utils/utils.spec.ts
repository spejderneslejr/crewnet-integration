import { generateCrewnetEmail } from './utils';

describe('utils', () => {
  describe('generateCrewnetEmail()', () => {
    it('should be defined', () => {
      expect(generateCrewnetEmail).toBeDefined();
    });

    it('should generate email in the correct format', () => {
      const email = generateCrewnetEmail(123);
      expect(email).toBe('123@crewnet.sl2026.dk');
    });
  });
});
