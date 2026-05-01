import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MedicalRecordDocument = HydratedDocument<MedicalRecord>;

@Schema({
  collection: 'medical_records',
  timestamps: true,
})
export class MedicalRecord {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ required: true, index: true })
  peopleId!: number;

  @Prop({ required: true, index: true })
  userId!: number;

  @Prop({ type: Number, default: null, index: true })
  organizationId!: number | null;

  @Prop({ required: true, trim: true })
  clinic!: string;

  @Prop({ type: String, default: null, trim: true })
  decision!: string | null;

  @Prop({ type: String, default: null, trim: true })
  reason!: string | null;

  @Prop({ type: String, default: null, trim: true })
  defermentReason!: string | null;

  @Prop({ type: Date, default: null })
  createdAtRecord!: Date | null;

  @Prop({ type: String, default: null, trim: true })
  notes!: string | null;
}

export const MedicalRecordSchema = SchemaFactory.createForClass(MedicalRecord);
