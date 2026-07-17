import { Injectable, Logger } from '@nestjs/common';
import { CamposApiConfigService } from './campos-api-config.service';
import * as xmlrpc from 'xmlrpc';

// The hardcoded organization ID to filter on. This is the ID for the main organization in Campos "Spejdernes Lejr 2026".
const ORGANIZATION_ID = 2;

export type CamposUserResult = {
  id: number;
  name: string;
  birthdate: string;
};

export type UnitResult = {
  id: number;
  name: string;
  organization_type: string;
};

export type CamposMember = {
  id: number;
  name: string;
  birthdate: string;
};

@Injectable()
export class CamposService {
  constructor(
    private config: CamposApiConfigService,
    private logger: Logger,
  ) {}

  /**
   * Returns all active volunteers in Campos.
   *
   * First it fetches all active member profiles in Campos, and then matches them
   * with the res.users to get the email and other details.
   *
   * The reason for this two-step process is that the member profiles do not contain
   * all the necessary information, in particular the user's id, which is necessary
   * to link to Crewnet, in order to enable SSO from CampOS.
   */
  async getAllActiveMembers(): Promise<CamposUserResult[]> {
    const members = (await this.executeKw('member.profile', 'search_read', [], {
      domain: [
        ['organization_id', '=', ORGANIZATION_ID],
        ['state', '=', 'active'],
        ['partner_id.function_ids', '!=', false],
      ],
      fields: ['name', 'birthdate_date', 'user_ids'],
      context: { lang: 'da_DK' },
    })) as unknown as Array<any>;

    return members.map((user) => ({
      id: user.user_ids[0], // hard assumption from test-queries
      name: user.name,
      birthdate: user.birthdate_date,
    }));
  }

  /**
   * Fetches all active units in Campos of the given types.
   *
   * @param unitTypes The types of units to fetch.
   * @returns A promise that resolves to an array of active units.
   */
  async getAllActiveUnits(unitTypes: string[]): Promise<UnitResult[]> {
    const units = (await this.executeKw(
      'member.organization',
      'search_read',
      [],
      {
        domain: [['organization_type_id', 'in', unitTypes]],
        fields: ['id', 'name', 'organization_type_id'],
        context: { lang: 'da_DK' },
      },
    )) as unknown as Array<any>;

    return units.map((unit) => ({
      id: unit.id,
      name: unit.name,
      organization_type: unit.organization_type_id[1],
    }));
  }

  /**
   * Get all users in a given unit
   *
   * @param unitName Name of the unit to fetch users for
   */
  async getUsersByUnitName(unitName: string): Promise<CamposUserResult[]> {
    const result = (await this.executeKw('member.profile', 'search_read', [], {
      domain: [
        ['organization_id', '=', 2],
        ['state', '=', 'active'],
        ['partner_id.function_ids', '!=', false],
        ['partner_id.active_function_ids.organization_id', '=', unitName],
      ],
      fields: ['name', 'birthdate_date', 'user_ids'],
      context: { lang: 'da_DK' },
    })) as unknown as Array<any>;

    return result.map((user) => ({
      id: user.user_ids[0], // hard assumption from test-queries
      name: user.name,
      birthdate: user.birthdate_date,
    }));
  }

  executeKw(
    model: string,
    method: string,
    paramsByPosition: any, //string[] = [],
    paramsByKeyword: unknown = {},
  ): Promise<string> {
    const clientOptions = {
      host: this.config.odooHostname,
      port: 443,
      path: '/xmlrpc/2/object',
    };
    const client = xmlrpc.createSecureClient(clientOptions);

    const fparams = [];
    fparams.push(this.config.odooDB);
    fparams.push(this.config.odooUID);
    fparams.push(this.config.odooPassword);
    fparams.push(model);
    fparams.push(method);
    fparams.push(paramsByPosition);
    fparams.push(paramsByKeyword);

    this.logger.debug({ fparams });
    return new Promise((resolve, reject) => {
      client.methodCall('execute_kw', fparams, function (error, value) {
        if (error) {
          return reject(error);
        }
        return resolve(value);
      });
    });
  }
}
