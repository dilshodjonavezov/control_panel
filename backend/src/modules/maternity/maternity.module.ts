import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CitizensModule } from '../citizens/citizens.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { UsersModule } from '../users/users.module';
import { MaternityController } from './maternity.controller';
import { MaternityService } from './maternity.service';
import { MaternityRecord, MaternityRecordSchema } from './schemas/maternity-record.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MaternityRecord.name, schema: MaternityRecordSchema }]),
    CitizensModule,
    UsersModule,
    OrganizationsModule,
  ],
  controllers: [MaternityController],
  providers: [MaternityService],
  exports: [MaternityService],
})
export class MaternityModule {}
