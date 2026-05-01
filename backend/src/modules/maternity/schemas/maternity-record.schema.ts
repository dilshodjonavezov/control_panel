import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MaternityRecordDocument = HydratedDocument<MaternityRecord>;

@Schema({
  collection: 'maternity_records',
  timestamps: true,
})
export class MaternityRecord {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ type: Number, default: null, index: true })
  childCitizenId!: number | null;

  @Prop({ type: Number, default: null, index: true })
  motherCitizenId!: number | null;

  @Prop({ type: Number, default: null, index: true })
  fatherCitizenId!: number | null;

  @Prop({ type: Number, default: null, index: true })
  familyId!: number | null;

  @Prop({ required: true, type: String, trim: true, default: 'STANDARD_MARRIAGE' })
  birthCaseType!: string;

  @Prop({ required: true, type: Date })
  birthDateTime!: Date;

  @Prop({ required: true, trim: true })
  placeOfBirth!: string;

  @Prop({ type: String, default: null, trim: true })
  childFullName!: string | null;

  @Prop({ type: String, default: null, trim: true })
  motherFullName!: string | null;

  @Prop({ type: String, default: null, trim: true })
  fatherFullName!: string | null;

  @Prop({ required: true, trim: true })
  gender!: string;

  @Prop({ type: Number, default: null })
  birthWeight!: number | null;

  @Prop({ type: String, default: null, trim: true })
  medicalCertificateNumber!: string | null;

  @Prop({ required: true, trim: true, default: 'DRAFT' })
  status!: string;

  @Prop({ type: String, default: null, trim: true })
  comment!: string | null;

  @Prop({ required: true, index: true })
  createdByUserId!: number;

  @Prop({ required: true, index: true })
  organizationId!: number;
}

export const MaternityRecordSchema = SchemaFactory.createForClass(MaternityRecord);
