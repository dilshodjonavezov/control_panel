import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RoleDocument = HydratedDocument<Role>;

@Schema({
  collection: 'roles',
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: false,
  },
})
export class Role {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ required: true, unique: true, trim: true })
  code!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ default: true })
  isActive!: boolean;

  createdAt!: Date;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
