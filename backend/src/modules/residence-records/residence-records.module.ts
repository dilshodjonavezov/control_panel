import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CitizensModule } from '../citizens/citizens.module';
import { UsersModule } from '../users/users.module';
import { ResidenceRecord, ResidenceRecordSchema } from './schemas/residence-record.schema';
import { ResidenceRecordsController } from './residence-records.controller';
import { ResidenceRecordsService } from './residence-records.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ResidenceRecord.name, schema: ResidenceRecordSchema }]),
    CitizensModule,
    UsersModule,
  ],
  controllers: [ResidenceRecordsController],
  providers: [ResidenceRecordsService],
  exports: [ResidenceRecordsService],
})
export class ResidenceRecordsModule {}
