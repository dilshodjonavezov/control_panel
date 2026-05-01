import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MedicalVisitDocument = HydratedDocument<MedicalVisit>;

@Schema({
  collection: 'medical_visits',
  timestamps: true,
})
export class MedicalVisit {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ required: true, index: true })
  peopleId!: number;

  @Prop({ type: Number, default: null, index: true })
  medicalRecordId!: number | null;

  @Prop({ required: true, index: true })
  userId!: number;

  @Prop({ required: true, trim: true })
  doctor!: string;

  @Prop({ type: Date, default: null })
  visitDate!: Date | null;

  @Prop({ required: true, trim: true })
  diagnosis!: string;

  @Prop({ type: String, default: null, trim: true })
  notes!: string | null;

  @Prop({ required: true, trim: true, default: 'DRAFT' })
  status!: string;
}

export const MedicalVisitSchema = SchemaFactory.createForClass(MedicalVisit);
