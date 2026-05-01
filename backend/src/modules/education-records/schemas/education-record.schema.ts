import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EducationRecordDocument = HydratedDocument<EducationRecord>;

@Schema({
  collection: 'education_records',
  timestamps: true,
})
export class EducationRecord {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ required: true, index: true })
  peopleId!: number;

  @Prop({ type: Number, default: null, index: true })
  schoolRecordId!: number | null;

  @Prop({ type: Number, default: null, index: true })
  medicalRecordId!: number | null;

  @Prop({ required: true, index: true })
  institutionId!: number;

  @Prop({ type: String, default: null, trim: true })
  studyForm!: string | null;

  @Prop({ type: String, default: null, trim: true })
  faculty!: string | null;

  @Prop({ type: String, default: null, trim: true })
  specialty!: string | null;

  @Prop({ type: Date, default: null })
  admissionDate!: Date | null;

  @Prop({ type: Date, default: null })
  expulsionDate!: Date | null;

  @Prop({ type: Date, default: null })
  graduationDate!: Date | null;

  @Prop({ required: true, default: true })
  isDeferralActive!: boolean;

  @Prop({ type: String, default: null, trim: true })
  defermentReviewStatus!: string | null;

  @Prop({ type: String, default: null, trim: true })
  defermentReviewComment!: string | null;

  @Prop({ type: Date, default: null })
  defermentReviewedAt!: Date | null;

  @Prop({ type: Number, default: null, index: true })
  defermentReviewedByUserId!: number | null;

  @Prop({ type: String, default: null, trim: true })
  expulsionProcessStatus!: string | null;

  @Prop({ type: String, default: null, trim: true })
  expulsionProcessComment!: string | null;

  @Prop({ type: Date, default: null })
  expulsionProcessedAt!: Date | null;

  @Prop({ type: Number, default: null, index: true })
  expulsionProcessedByUserId!: number | null;

  @Prop({ required: true, index: true })
  userId!: number;
}

export const EducationRecordSchema = SchemaFactory.createForClass(EducationRecord);
