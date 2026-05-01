import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EducationInstitutionDocument = HydratedDocument<EducationInstitution>;

@Schema({
  collection: 'education_institutions',
  timestamps: true,
})
export class EducationInstitution {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true })
  type!: string;

  @Prop({ type: String, default: null, trim: true })
  address!: string | null;

  @Prop({ type: String, default: null, trim: true })
  description!: string | null;
}

export const EducationInstitutionSchema = SchemaFactory.createForClass(EducationInstitution);
