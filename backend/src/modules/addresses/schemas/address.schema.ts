import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AddressDocument = HydratedDocument<Address>;

@Schema({
  collection: 'addresses',
  timestamps: true,
})
export class Address {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ required: true, index: true })
  citizenId!: number;

  @Prop({ type: Number, default: null })
  familyId!: number | null;

  @Prop({ required: true, trim: true, default: 'REGISTRATION' })
  type!: string;

  @Prop({ required: true, trim: true })
  region!: string;

  @Prop({ type: String, default: null, trim: true })
  district!: string | null;

  @Prop({ type: String, default: null, trim: true })
  city!: string | null;

  @Prop({ required: true, trim: true })
  street!: string;

  @Prop({ required: true, trim: true })
  house!: string;

  @Prop({ type: String, default: null, trim: true })
  apartment!: string | null;

  @Prop({ type: String, default: null, trim: true })
  postalCode!: string | null;

  @Prop({ required: true, type: Date })
  startDate!: Date;

  @Prop({ type: Date, default: null })
  endDate!: Date | null;

  @Prop({ required: true, default: true })
  isActive!: boolean;

  @Prop({ required: true, trim: true })
  fullAddress!: string;

  @Prop({ type: String, default: null, trim: true })
  notes!: string | null;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
