import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PassportRecordDocument = HydratedDocument<PassportRecord>;

@Schema({
  collection: 'passport_records',
  timestamps: true,
})
export class PassportRecord {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ required: true, index: true })
  peopleId!: number;

  @Prop({ required: true, index: true })
  userId!: number;

  @Prop({ required: true, trim: true })
  passportNumber!: string;

  @Prop({ type: Date, default: null })
  dateOfIssue!: Date | null;

  @Prop({ type: Date, default: null })
  expireDate!: Date | null;

  @Prop({ required: true, trim: true })
  placeOfIssue!: string;

  @Prop({ type: Date, default: null })
  dateBirth!: Date | null;
}

export const PassportRecordSchema = SchemaFactory.createForClass(PassportRecord);
