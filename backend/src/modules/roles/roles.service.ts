import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CountersService } from '../counters/counters.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ROLE_SEED } from './role.constants';
import { Role, RoleDocument } from './schemas/role.schema';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    private readonly countersService: CountersService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.backfillMissingIds();
    await this.seedDefaults();
  }

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const nextId = await this.countersService.getNextSequence('roles');
    const created = await this.roleModel.create({
      id: nextId,
      ...createRoleDto,
      isActive: createRoleDto.isActive ?? true,
    });
    return this.mapRole(created.toObject());
  }

  async findAll(): Promise<Role[]> {
    const roles = await this.roleModel.find().sort({ code: 1 }).lean();
    return roles.map((role) => this.mapRole(role));
  }

  async findOne(id: number | string): Promise<Role> {
    const numericId = this.parseId(id, 'Role');
    const role = await this.roleModel.findOne({ id: numericId }).lean();
    if (!role) {
      throw new NotFoundException(`Role ${numericId} not found`);
    }
    return this.mapRole(role);
  }

  async update(id: number | string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const numericId = this.parseId(id, 'Role');
    const role = await this.roleModel
      .findOneAndUpdate({ id: numericId }, updateRoleDto, { new: true, runValidators: true })
      .lean();
    if (!role) {
      throw new NotFoundException(`Role ${numericId} not found`);
    }
    return this.mapRole(role);
  }

  async remove(id: number | string): Promise<void> {
    const numericId = this.parseId(id, 'Role');
    const result = await this.roleModel.findOneAndDelete({ id: numericId }).lean();
    if (!result) {
      throw new NotFoundException(`Role ${numericId} not found`);
    }
  }

  private async seedDefaults(): Promise<void> {
    for (const role of ROLE_SEED) {
      const existing = await this.roleModel.findOne({ code: role.code }).lean();
      if (!existing) {
        const nextId = await this.countersService.getNextSequence('roles');
        await this.roleModel.create({ id: nextId, ...role, isActive: true });
      }
    }
  }

  private async backfillMissingIds(): Promise<void> {
    const rolesWithoutIds = await this.roleModel.find({ id: { $exists: false } }).lean();
    for (const role of rolesWithoutIds) {
      const nextId = await this.countersService.getNextSequence('roles');
      await this.roleModel.updateOne({ _id: role._id }, { $set: { id: nextId } });
    }
  }

  private parseId(id: number | string, entity: string): number {
    const numericId = typeof id === 'number' ? id : Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new NotFoundException(`${entity} ${id} not found`);
    }
    return numericId;
  }

  private mapRole(role: Record<string, any>): Role {
    return {
      id: role.id,
      code: role.code,
      name: role.name,
      isActive: role.isActive,
      createdAt: role.createdAt,
    } as Role;
  }
}
