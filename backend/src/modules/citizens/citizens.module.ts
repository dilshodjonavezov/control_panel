import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Citizen, CitizenSchema } from './schemas/citizen.schema';
import { CitizensController } from './citizens.controller';
import { CitizensService } from './citizens.service';
import { PeopleController } from './people.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Citizen.name, schema: CitizenSchema }])],
  controllers: [CitizensController, PeopleController],
  providers: [CitizensService],
  exports: [CitizensService],
})
export class CitizensModule {}
