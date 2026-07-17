const CREWNET_EMAIL_DOMAIN = 'crewnet.sl2026.dk';

/**
 *  Generates a Crewnet email address for a given Campos user ID.
 *
 * @param camposUserId - The ID of the user in Campos for whom to generate the Crewnet email.
 * @returns A string representing the generated Crewnet email address.
 */
export function generateCrewnetEmail(camposUserId: number): string {
  return `${camposUserId}@${CREWNET_EMAIL_DOMAIN}`;
}
