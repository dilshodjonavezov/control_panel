import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CitizenDocument = HydratedDocument<Citizen>;

@Schema({
  collection: 'citizens',
  timestamps: true,
})
export class Citizen {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ type: String, required: false, unique: true, sparse: true, trim: true })
  iin?: string;

  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({ type: String, default: null, trim: true })
  middleName!: string | null;

  @Prop({ required: true, trim: true })
  fullName!: string;

  @Prop({ required: true, type: Date })
  birthDate!: Date;

  @Prop({ required: true, trim: true })
  gender!: string;

  @Prop({ required: true, trim: true, default: 'Таджикистан' })
  citizenship!: string;

  @Prop({ required: true, trim: true, default: 'ACTIVE' })
  lifeStatus!: string;

  @Prop({ type: String, default: null, trim: true })
  motherFullName!: string | null;

  @Prop({ type: Number, default: null, index: true })
  motherCitizenId!: number | null;

  @Prop({ type: String, default: null, trim: true })
  fatherFullName!: string | null;

  @Prop({ type: Number, default: null, index: true })
  fatherCitizenId!: number | null;

  @Prop({ type: Number, default: null, index: true })
  familyId!: number | null;

  @Prop({ type: Boolean, default: false })
  militaryRegisteredAtBirth!: boolean;
}

export const CitizenSchema = SchemaFactory.createForClass(Citizen);
