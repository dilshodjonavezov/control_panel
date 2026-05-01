import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ResidenceRecordDocument = HydratedDocument<ResidenceRecord>;

@Schema({
  collection: 'residence_records',
  timestamps: true,
})
export class ResidenceRecord {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ required: true, index: true })
  peopleId!: number;

  @Prop({ required: true, trim: true })
  address!: string;

  @Prop({ required: true, type: Date })
  registeredAt!: Date;

  @Prop({ type: Date, default: null })
  unregisteredAt!: Date | null;

  @Prop({ required: true, default: true })
  isActive!: boolean;

  @Prop({ required: true, index: true })
  userId!: number;

  @Prop({ type: String, default: null, trim: true })
  comment!: string | null;
}

export const ResidenceRecordSchema = SchemaFactory.createForClass(ResidenceRecord);
