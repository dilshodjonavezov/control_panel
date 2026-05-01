import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BorderCrossingDocument = HydratedDocument<BorderCrossing>;

@Schema({
  collection: 'border_crossings',
  timestamps: true,
})
export class BorderCrossing {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ required: true, index: true })
  peopleId!: number;

  @Prop({ required: true, index: true })
  userId!: number;

  @Prop({ type: Number, default: null, index: true })
  organizationId!: number | null;

  @Prop({ required: true, type: Date, index: true })
  departureDate!: Date;

  @Prop({ type: Date, default: null, index: true })
  returnDate!: Date | null;

  @Prop({ required: true, default: true })
  outsideBorder!: boolean;

  @Prop({ required: true, trim: true, default: 'EXIT' })
  eventType!: string;

  @Prop({ required: true, trim: true, default: 'OUTBOUND' })
  direction!: string;

  @Prop({ required: true, trim: true, default: 'OPEN' })
  status!: string;

  @Prop({ type: String, default: null, trim: true })
  country!: string | null;

  @Prop({ type: String, default: null, trim: true })
  purpose!: string | null;

  @Prop({ type: String, default: null, trim: true })
  borderCheckpoint!: string | null;

  @Prop({ type: String, default: null, trim: true })
  transportType!: string | null;

  @Prop({ type: String, default: null, trim: true })
  documentNumber!: string | null;

  @Prop({ type: String, default: null, trim: true })
  description!: string | null;
}

export const BorderCrossingSchema = SchemaFactory.createForClass(BorderCrossing);
