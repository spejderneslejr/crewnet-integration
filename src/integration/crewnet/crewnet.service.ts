import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { last, lastValueFrom } from 'rxjs';
import { CrewnetApiConfigService } from './crewnet-api-config.service';

export type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  address: string;
  zip: string;
  city: string;
  country: string;
  phone: string;
  no_phone: boolean;
};

export type UserCreate = {
  first_name: string;
  last_name: string;
  email: string;
  birthday: string;
};

export type UserUpdate = {
  first_name?: string;
  last_name?: string;
  email?: string;
  birthday?: string;
  address?: string;
  zip?: string;
  city?: string;
  country?: string;
  phone?: string;
  no_phone?: boolean;
};

export type Workplace = {
  id: number;
  name: string;
  workplace_category_id: number;
  age: number;
  allow_create_happening: boolean;
  allow_comment: boolean;
};

export type SyncWorkplace = {
  id: number;
  name: string;
};

type WorkplaceUser = {
  id: number;
  name: string;
};

@Injectable()
export class CrewnetService {
  constructor(
    private readonly logger: Logger,
    private httpService: HttpService,
    private config: CrewnetApiConfigService,
  ) {
    this.httpService.axiosRef.interceptors.request.use((request) => {
      this.logger.debug('Starting Request', request);
      return request;
    });

    this.httpService.axiosRef.interceptors.response.use((response) => {
      this.logger.debug('Response:', JSON.stringify(response.data, null, 2));
      return response;
    });
  }

  async getAllMembers(): Promise<Array<User>> {
    return this.get<Array<User>>('users', {
      event_id: this.config.crewnetEventId,
    });
  }

  async getAllWorkplaces(): Promise<Array<Workplace>> {
    return this.get<Array<Workplace>>('workplaces', {
      event_id: this.config.crewnetEventId,
    });
  }

  async addMemberToWorkplace(
    workplaceId: number,
    memberId: number,
  ): Promise<void> {
    const postData = {
      user_id: memberId,
    };

    await lastValueFrom(
      this.httpService.post(
        `/events/${this.config.crewnetEventId}/workplaces/${workplaceId}/users`,
        postData,
      ),
    );
  }

  async getUsersByWorkplaceId(
    workplaceId: number,
  ): Promise<Array<WorkplaceUser>> {
    return this.get<Array<WorkplaceUser>>(
      `events/${this.config.crewnetEventId}/workplaces/${workplaceId}/users`,
    );
  }

  async userUpdate(userId: number, userData: UserUpdate): Promise<void> {
    this.logger.debug(`/users/${userId}`);
    this.logger.debug({ userData });
    try {
      const data = await lastValueFrom(
        this.httpService.put(`/users/${userId}`, userData),
      );

      this.logger.debug({ putData: data.data });
    } catch (err) {
      this.logger.error('Error while updating user ' + userId + ': ');
      this.logger.error(err.response.data);
    }

    return;
  }

  async userCreate(user: UserCreate): Promise<number> {
    const postData = {
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      birthday: user.birthday,
    };

    const data = await lastValueFrom(this.httpService.post(`/users`, postData));
    const userId = data.data.id as number;

    return userId;
  }

  async workplaceCreate(
    name: string,
    workplace_category_id: number | null = null,
  ): Promise<{ id: number }> {
    const postData = {
      name,
      workplace_category_id,
      allow_create_happening: true,
      allow_comment: true,
      age: 0,
      helper_needed: 10_000,
    };

    const data = await lastValueFrom(
      this.httpService.post(`/workplaces`, postData),
    );
    const workplaceId = data.data.id;

    const addToEventData = JSON.parse(
      JSON.stringify({
        workplace_id: workplaceId,
        helper_need: 10_000,
      }),
    );
    // TODO: Need a cleaner way of getting to event_id.
    const eventId = this.config.crewnetEventId;
    await lastValueFrom(
      this.httpService.post(`/events/${eventId}/workplaces`, addToEventData),
    );

    return {
      id: workplaceId,
    };
  }

  private async get<Type>(
    endpoint: string,
    params: object = {},
  ): Promise<Type> {
    const response = await lastValueFrom(
      this.httpService.get(`/${endpoint}`, { params }),
    );
    return response.data;
  }
}
