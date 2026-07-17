import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CamposApiConfigService {
  constructor(private configService: ConfigService) {}

  get odooHostname(): string {
    return this.configService.get('odoo_hostname');
  }

  get odooUID(): string {
    return this.configService.get('odoo_uid');
  }

  get odooPassword(): string {
    return this.configService.get('odoo_password');
  }

  get odooDB(): string {
    return this.configService.get('odoo_db');
  }
}
