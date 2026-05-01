import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter, CounterDocument } from './schemas/counter.schema';

@Injectable()
export class CountersService {
  constructor(
    @InjectModel(Counter.name) private readonly counterModel: Model<CounterDocument>,
  ) {}

  async getNextSequence(key: string): Promise<number> {
    const counter = await this.counterModel
      .findOneAndUpdate(
        { key },
        { $inc: { value: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .lean();

    return counter.value;
  }
}
