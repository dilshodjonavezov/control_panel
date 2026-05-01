import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CitizensModule } from '../citizens/citizens.module';
import { UsersModule } from '../users/users.module';
import { PassportController } from './passport.controller';
import { PassportService } from './passport.service';
import { PassportRecord, PassportRecordSchema } from './schemas/passport-record.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PassportRecord.name, schema: PassportRecordSchema }]),
    CitizensModule,
    UsersModule,
  ],
  controllers: [PassportController],
  providers: [PassportService],
  exports: [PassportService],
})
export class PassportModule {}
