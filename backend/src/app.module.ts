import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLogInterceptor } from './common/audit/audit-log.interceptor';
import { JwtAuthGuard } from './common/auth/dev-auth.guard';
import { RolesGuard } from './common/roles/roles.guard';
import { databaseConfig } from './config/database.config';
import { resolveMongoUri } from './config/mongo-uri';
import { AddressesModule } from './modules/addresses/addresses.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { AuthModule } from './modules/auth/auth.module';
import { BorderModule } from './modules/border/border.module';
import { CitizensModule } from './modules/citizens/citizens.module';
import { CountersModule } from './modules/counters/counters.module';
import { EducationInstitutionsModule } from './modules/education-institutions/education-institutions.module';
import { EducationRecordsModule } from './modules/education-records/education-records.module';
import { EnumsModule } from './modules/enums/enums.module';
import { FamiliesModule } from './modules/families/families.module';
import { MaternityModule } from './modules/maternity/maternity.module';
import { MedicalRecordsModule } from './modules/medical-records/medical-records.module';
import { MedicalVisitsModule } from './modules/medical-visits/medical-visits.module';
import { MilitaryModule } from './modules/military/military.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { PassportModule } from './modules/passport/passport.module';
import { ResidenceRecordsModule } from './modules/residence-records/residence-records.module';
import { RolesModule } from './modules/roles/roles.module';
import { SchoolModule } from './modules/school/school.module';
import { UsersModule } from './modules/users/users.module';
import { VvkResultsModule } from './modules/vvk-results/vvk-results.module';
import { ZagsModule } from './modules/zags/zags.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: await resolveMongoUri(configService.get<string>('database.mongoUri')),
      }),
    }),
    AuditLogsModule,
    CountersModule,
    EducationInstitutionsModule,
    EducationRecordsModule,
    RolesModule,
    OrganizationsModule,
    UsersModule,
    AuthModule,
    BorderModule,
    CitizensModule,
    FamiliesModule,
    AddressesModule,
    ResidenceRecordsModule,
    PassportModule,
    SchoolModule,
    MedicalRecordsModule,
    MedicalVisitsModule,
    MilitaryModule,
    VvkResultsModule,
    MaternityModule,
    ZagsModule,
    EnumsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule {}
