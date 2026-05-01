import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MilitaryRecordDocument = HydratedDocument<MilitaryRecord>;

@Schema({
  collection: 'military_records',
  timestamps: true,
})
export class MilitaryRecord {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ required: true, index: true })
  peopleId!: number;

  @Prop({ required: true, index: true })
  userId!: number;

  @Prop({ type: Number, default: null, index: true })
  organizationId!: number | null;

  @Prop({ required: true, trim: true })
  office!: string;

  @Prop({ type: String, default: null, trim: true })
  district!: string | null;

  @Prop({ required: true, type: Date })
  enlistDate!: Date;

  @Prop({ type: String, default: null, trim: true })
  assignmentDate!: string | null;

  @Prop({ type: String, default: null, trim: true })
  category!: string | null;

  @Prop({ required: true, trim: true, default: 'ENLISTED' })
  status!: string;

  @Prop({ required: true, trim: true, default: 'CONSCRIPT' })
  militaryStatus!: string;

  @Prop({ type: String, default: null, trim: true })
  defermentReason!: string | null;

  @Prop({ type: Date, default: null })
  defermentUntil!: Date | null;

  @Prop({ type: Boolean, default: false })
  militaryOfficeNotified!: boolean;

  @Prop({ type: String, default: null, trim: true })
  notes!: string | null;

  @Prop({ type: String, default: null, trim: true })
  defermentReviewStatus!: string | null;

  @Prop({ type: String, default: null, trim: true })
  defermentReviewComment!: string | null;

  @Prop({ type: Date, default: null })
  defermentReviewedAt!: Date | null;

  @Prop({ type: Number, default: null, index: true })
  defermentReviewedByUserId!: number | null;
}

export const MilitaryRecordSchema = SchemaFactory.createForClass(MilitaryRecord);
