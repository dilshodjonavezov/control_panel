import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ZagsActDocument = HydratedDocument<ZagsAct>;

@Schema({ _id: false })
export class ZagsBirthDetails {
  @Prop({ type: Number, default: null })
  childCitizenId!: number | null;

  @Prop({ type: String, required: true, trim: true, default: 'STANDARD_MARRIAGE' })
  birthCaseType!: string;

  @Prop({ type: String, default: null, trim: true })
  childFullName!: string | null;

  @Prop({ required: true, type: Date })
  birthDate!: Date;

  @Prop({ required: true, trim: true })
  birthPlace!: string;

  @Prop({ type: Number, default: null })
  motherCitizenId!: number | null;

  @Prop({ type: String, default: null, trim: true })
  motherFullName!: string | null;

  @Prop({ type: Number, default: null })
  fatherCitizenId!: number | null;

  @Prop({ type: String, default: null, trim: true })
  fatherFullName!: string | null;
}

@Schema({ _id: false })
export class ZagsMarriageDetails {
  @Prop({ type: Number, default: null })
  spouseOneCitizenId!: number | null;

  @Prop({ required: true, trim: true })
  spouseOneFullName!: string;

  @Prop({ type: Number, default: null })
  spouseTwoCitizenId!: number | null;

  @Prop({ required: true, trim: true })
  spouseTwoFullName!: string;

  @Prop({ required: true, type: Date })
  marriageDate!: Date;

  @Prop({ required: true, trim: true })
  marriagePlace!: string;
}

@Schema({ _id: false })
export class ZagsDeathDetails {
  @Prop({ type: Number, default: null })
  deceasedCitizenId!: number | null;

  @Prop({ required: true, trim: true })
  deceasedFullName!: string;

  @Prop({ required: true, type: Date })
  deathDate!: Date;

  @Prop({ required: true, trim: true })
  deathPlace!: string;

  @Prop({ type: String, default: null, trim: true })
  deathReason!: string | null;
}

@Schema({
  collection: 'zags_acts',
  timestamps: true,
})
export class ZagsAct {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ required: true, unique: true, trim: true })
  actNumber!: string;

  @Prop({ required: true, trim: true })
  actType!: string;

  @Prop({ required: true, trim: true, default: 'DRAFT' })
  status!: string;

  @Prop({ required: true, type: Date })
  registrationDate!: Date;

  @Prop({ required: true, trim: true })
  placeOfRegistration!: string;

  @Prop({ type: Number, default: null })
  citizenId!: number | null;

  @Prop({ type: Number, default: null })
  maternityRecordId!: number | null;

  @Prop({ type: Number, default: null })
  familyId!: number | null;

  @Prop({ required: true, index: true })
  createdByUserId!: number;

  @Prop({ required: true, index: true })
  organizationId!: number;

  @Prop({ type: ZagsBirthDetails, default: null })
  birthDetails!: ZagsBirthDetails | null;

  @Prop({ type: ZagsMarriageDetails, default: null })
  marriageDetails!: ZagsMarriageDetails | null;

  @Prop({ type: ZagsDeathDetails, default: null })
  deathDetails!: ZagsDeathDetails | null;
}

export const ZagsActSchema = SchemaFactory.createForClass(ZagsAct);
