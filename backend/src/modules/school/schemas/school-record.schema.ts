import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SchoolRecordDocument = HydratedDocument<SchoolRecord>;

@Schema({
  collection: 'school_records',
  timestamps: true,
})
export class SchoolRecord {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ required: true, index: true })
  peopleId!: number;

  @Prop({ required: true, index: true })
  institutionId!: number;

  @Prop({ required: true })
  classNumber!: number;

  @Prop({ type: Date, default: null })
  admissionDate!: Date | null;

  @Prop({ type: Date, default: null })
  graduationDate!: Date | null;

  @Prop({ type: Date, default: null })
  expulsionDate!: Date | null;

  @Prop({ required: true, default: true })
  isStudying!: boolean;

  @Prop({ required: true, index: true })
  userId!: number;

  @Prop({ type: String, default: null, trim: true })
  comment!: string | null;
}

export const SchoolRecordSchema = SchemaFactory.createForClass(SchoolRecord);
