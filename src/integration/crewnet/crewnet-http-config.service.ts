import { Injectable } from '@nestjs/common';
import { HttpModuleOptions, HttpModuleOptionsFactory } from '@nestjs/axios';
import { CrewnetApiConfigService } from './crewnet-api-config.service';

@Injectable()
export class CrewnetHttpConfigService implements HttpModuleOptionsFactory {
  constructor(private readonly config: CrewnetApiConfigService) {}

  createHttpOptions(): HttpModuleOptions {
    return {
      baseURL: this.config.crewnetApiBasePath,
      headers: { Authorization: `Bearer ${this.config.crewnetToken}` },
    };
  }
}
