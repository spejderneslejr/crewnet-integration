import { Logger, Module } from '@nestjs/common';
// import {
//   CamposMembersInUnit,
//   CamposSyncWorkplaceCategoriesAuto,
//   CamposSyncWorkplaceCategoryByUnit,
//   ConvertSpreadsheetImages,
//   CrewnetDeleteCampOSWorkplaceCategories,
//   CrewnetDeleteWorkplaceCategories,
//   CrewnetGetWorkplaceCategoryMembers,
//   CrewnetImportWorkplaces,
//   CrewnetSyncMemberContactInfo,
//   EventGetAll,
//   GroupCreateCommand,
//   WorkplaceCategoriesGetCommand,
//   WorkplaceCreateCommand,
//   ConvertCsvImages,
//   WorkplacesGetCommand,
//   CrewnetNonCamposUsers,
//   CrewnetBulkDelete,
//   GenerateLicenseSheet,
//   GenerateLicensePdf,
//   SyncGuestHelpers,
//   GenerateAccessCardPdf,
// } from './cli/all.command';
import { CrewnetModule } from './integration/crewnet/crewnet.module';
import { ConfigModule } from '@nestjs/config';
import { CamposModule } from './integration/campos/campos.module';
import { CliUtilsService } from './cliutils';

@Module({
  imports: [
    CrewnetModule,
    CamposModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],

  providers: [
    // CamposMembersInUnit,
    // CamposSyncWorkplaceCategoriesAuto,
    // CamposSyncWorkplaceCategoryByUnit,
    // CliUtilsService,
    // CampCtlService,
    // ConvertCsvImages,
    // ConvertSpreadsheetImages,
    // CrewnetBulkDelete,
    // CrewnetDeleteCampOSWorkplaceCategories,
    // CrewnetDeleteWorkplaceCategories,
    // CrewnetGetWorkplaceCategoryMembers,
    // CrewnetImportWorkplaces,
    // CrewnetNonCamposUsers,
    // CrewnetSyncMemberContactInfo,
    // CSVService,
    // EventGetAll,
    // ExcelJSService,
    // GenerateAccessCardPdf,
    // GenerateLicensePdf,
    // GenerateLicenseSheet,
    // GroupCreateCommand,
    // JimpService,
    // Logger,
    // PDFService,
    // SyncGuestHelpers,
    // WorkplaceCategoriesGetCommand,
    // WorkplaceCreateCommand,
    // WorkplacesGetCommand,
    // XslxService,
  ],
})
export class CliModule {}
