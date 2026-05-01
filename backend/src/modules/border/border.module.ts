import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CitizensModule } from '../citizens/citizens.module';
import { UsersModule } from '../users/users.module';
import { BorderController } from './border.controller';
import { BorderService } from './border.service';
import { BorderCrossing, BorderCrossingSchema } from './schemas/border-crossing.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: BorderCrossing.name, schema: BorderCrossingSchema }]),
    CitizensModule,
    UsersModule,
  ],
  controllers: [BorderController],
  providers: [BorderService],
  exports: [BorderService],
})
export class BorderModule {}
