import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CitizensModule } from '../citizens/citizens.module';
import { UsersModule } from '../users/users.module';
import { VvkResult, VvkResultSchema } from './schemas/vvk-result.schema';
import { VvkResultsController } from './vvk-results.controller';
import { VvkResultsService } from './vvk-results.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: VvkResult.name, schema: VvkResultSchema }]),
    CitizensModule,
    UsersModule,
  ],
  controllers: [VvkResultsController],
  providers: [VvkResultsService],
  exports: [VvkResultsService],
})
export class VvkResultsModule {}
