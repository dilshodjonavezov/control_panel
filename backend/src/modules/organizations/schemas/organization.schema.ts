import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrganizationDocument = HydratedDocument<Organization>;

@Schema({
  collection: 'organizations',
  timestamps: true,
})
export class Organization {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ required: true, trim: true })
  type!: string;

  @Prop({ required: true, unique: true, trim: true })
  code!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ type: String, default: null, trim: true })
  city!: string | null;

  @Prop({ type: String, default: null, trim: true })
  addressText!: string | null;

  @Prop({ type: String, default: null, trim: true })
  phone!: string | null;

  @Prop({ type: String, default: null, trim: true })
  email!: string | null;

  @Prop({ type: String, default: null, trim: true })
  headFullName!: string | null;

  @Prop({ type: String, default: null, trim: true })
  headPosition!: string | null;

  @Prop({ type: String, default: null, trim: true })
  serviceArea!: string | null;

  @Prop({ type: String, default: null, trim: true })
  licenseNumber!: string | null;

  @Prop({ type: Number, default: null })
  capacity!: number | null;

  @Prop({ type: Number, default: null, index: true })
  educationInstitutionId!: number | null;

  @Prop({ default: true })
  isActive!: boolean;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
