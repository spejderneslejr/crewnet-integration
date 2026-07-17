import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CrewnetApiConfigService {
  constructor(private configService: ConfigService) {}

  get crewnetApiDomain(): string {
    return this.configService.get('crewnet_apidomain');
  }

  get crewnetApiBasePath(): string {
    const domain = this.crewnetApiDomain;
    const host =
      domain.startsWith('http://') || domain.startsWith('https://')
        ? domain
        : `https://${domain}`;
    return `${host.replace(/\/$/, '')}/v1`;
  }

  get crewnetEventId(): string {
    return this.configService.get('crewnet_event_id');
  }

  get crewnetToken(): string {
    return this.configService.get('crewnet_token');
  }
}
