import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CitizensModule } from '../citizens/citizens.module';
import { Family, FamilySchema } from '../families/schemas/family.schema';
import { UsersModule } from '../users/users.module';
import { MilitaryController } from './military.controller';
import { MilitaryService } from './military.service';
import { MilitaryRecord, MilitaryRecordSchema } from './schemas/military-record.schema';
import { ZagsAct, ZagsActSchema } from '../zags/schemas/zags-act.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MilitaryRecord.name, schema: MilitaryRecordSchema },
      { name: ZagsAct.name, schema: ZagsActSchema },
      { name: Family.name, schema: FamilySchema },
    ]),
    CitizensModule,
    UsersModule,
  ],
  controllers: [MilitaryController],
  providers: [MilitaryService],
  exports: [MilitaryService],
})
export class MilitaryModule {}
