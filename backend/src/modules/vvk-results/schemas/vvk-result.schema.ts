import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VvkResultDocument = HydratedDocument<VvkResult>;

@Schema({
  collection: 'vvk_results',
  timestamps: true,
})
export class VvkResult {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ required: true, index: true })
  peopleId!: number;

  @Prop({ required: true, index: true })
  userId!: number;

  @Prop({ type: Number, default: null, index: true })
  organizationId!: number | null;

  @Prop({ type: Number, default: null, index: true })
  medicalVisitId!: number | null;

  @Prop({ required: true, type: Date })
  examDate!: Date;

  @Prop({ required: true, trim: true })
  category!: string;

  @Prop({ required: true, trim: true, default: 'WAITING' })
  queueStatus!: string;

  @Prop({ type: String, default: null, trim: true })
  fitnessCategory!: string | null;

  @Prop({ type: String, default: null, trim: true })
  finalDecision!: string | null;

  @Prop({ type: String, default: null, trim: true })
  reason!: string | null;

  @Prop({ type: String, default: null, trim: true })
  notes!: string | null;

  @Prop({ type: Date, default: null })
  nextReviewDate!: Date | null;
}

export const VvkResultSchema = SchemaFactory.createForClass(VvkResult);
