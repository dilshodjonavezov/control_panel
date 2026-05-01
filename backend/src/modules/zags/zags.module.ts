import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CitizensModule } from '../citizens/citizens.module';
import { FamiliesModule } from '../families/families.module';
import { MaternityModule } from '../maternity/maternity.module';
import { MilitaryModule } from '../military/military.module';
import { UsersModule } from '../users/users.module';
import { ZagsController } from './zags.controller';
import { ZagsBirthRecordsController } from './zags-birth-records.controller';
import { ZagsAct, ZagsActSchema } from './schemas/zags-act.schema';
import { ZagsService } from './zags.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ZagsAct.name, schema: ZagsActSchema }]),
    UsersModule,
    MaternityModule,
    CitizensModule,
    FamiliesModule,
    MilitaryModule,
  ],
  controllers: [ZagsController, ZagsBirthRecordsController],
  providers: [ZagsService],
  exports: [ZagsService],
})
export class ZagsModule {}
