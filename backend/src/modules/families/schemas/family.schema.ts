import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FamilyDocument = HydratedDocument<Family>;

@Schema({
  collection: 'families',
  timestamps: true,
})
export class Family {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ type: String, required: true, trim: true })
  familyName!: string;

  @Prop({ type: Number, required: true, index: true })
  primaryCitizenId!: number;

  @Prop({ type: Number, default: null, index: true })
  fatherCitizenId!: number | null;

  @Prop({ type: Number, default: null, index: true })
  motherCitizenId!: number | null;

  @Prop({ type: [Number], default: [] })
  memberCitizenIds!: number[];

  @Prop({ type: [Number], default: [] })
  childCitizenIds!: number[];

  @Prop({ type: [Number], default: [] })
  militaryRegisteredChildCitizenIds!: number[];

  @Prop({ type: Number, default: null })
  addressId!: number | null;

  @Prop({ type: String, default: 'ACTIVE', trim: true })
  status!: string;

  @Prop({ type: String, default: null, trim: true })
  notes!: string | null;
}

export const FamilySchema = SchemaFactory.createForClass(Family);
