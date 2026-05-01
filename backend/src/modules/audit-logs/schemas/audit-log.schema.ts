import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({
  collection: 'audit_logs',
  timestamps: true,
})
export class AuditLog {
  @Prop({ required: true, index: true })
  action!: string;

  @Prop({ required: true, index: true })
  method!: string;

  @Prop({ required: true, trim: true })
  path!: string;

  @Prop({ type: Number, default: null, index: true })
  userId!: number | null;

  @Prop({ type: String, default: null, trim: true })
  username!: string | null;

  @Prop({ type: String, default: null, trim: true })
  roleCode!: string | null;

  @Prop({ type: Number, default: null })
  targetId!: number | null;

  @Prop({ type: String, default: null, trim: true })
  entity!: string | null;

  @Prop({ type: Object, default: null })
  requestBody!: Record<string, unknown> | null;

  @Prop({ type: Number, default: null })
  statusCode!: number | null;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
