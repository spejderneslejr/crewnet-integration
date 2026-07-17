import { Logger, Module } from '@nestjs/common';
import { EndpointsController } from './endpoints.controller';
import { CamposModule } from 'src/integration/campos/campos.module';
import { CrewnetModule } from 'src/integration/crewnet/crewnet.module';
import { ApplicationModule } from 'src/application/application.module';

/**
 * Provides endpoints required for Drupal to authenticate and identify an
 * user.
 */
@Module({
  imports: [CamposModule, CrewnetModule, ApplicationModule],
  providers: [Logger],
  controllers: [EndpointsController],
})
export class EndpointsModule {}
