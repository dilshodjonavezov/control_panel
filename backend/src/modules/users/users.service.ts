import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CountersService } from '../counters/counters.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { RolesService } from '../roles/roles.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { USER_SEED } from './user.seed';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly countersService: CountersService,
    private readonly rolesService: RolesService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.backfillMissingIds();
    await this.seedDefaults();
  }

  async create(createUserDto: CreateUserDto): Promise<Record<string, unknown>> {
    await this.rolesService.findOne(createUserDto.roleId);
    if (createUserDto.organizationId) {
      await this.organizationsService.findOne(createUserDto.organizationId);
    }

    const nextId = await this.countersService.getNextSequence('users');
    await this.userModel.create({
      id: nextId,
      username: createUserDto.username,
      passwordHash: createUserDto.password,
      fullName: createUserDto.fullName,
      email: createUserDto.email ?? null,
      phone: createUserDto.phone ?? null,
      roleId: createUserDto.roleId,
      organizationId: createUserDto.organizationId ?? null,
      isActive: createUserDto.isActive ?? true,
      lastLoginAt: null,
    });

    return this.findOne(nextId);
  }

  async findAll(): Promise<Record<string, unknown>[]> {
    const [users, roles, organizations] = await Promise.all([
      this.userModel.find().sort({ createdAt: -1 }).lean(),
      this.rolesService.findAll(),
      this.organizationsService.findAll(),
    ]);

    const roleById = new Map(roles.map((role) => [role.id, role]));
    const organizationById = new Map(organizations.map((organization) => [organization.id, organization]));

    return users.map((user: Record<string, any>) => this.mapUser(user, roleById, organizationById));
  }

  async findOne(id: number | string): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'User');
    const user = await this.userModel.findOne({ id: numericId }).lean();
    if (!user) {
      throw new NotFoundException(`User ${numericId} not found`);
    }

    return this.mapUserWithLookups(user);
  }

  async validateCredentials(
    username: string,
    password: string,
  ): Promise<Record<string, unknown> | null> {
    const user = await this.userModel.findOne({ username, passwordHash: password }).lean();
    if (!user || user.isActive === false) {
      return null;
    }

    await this.userModel.updateOne({ id: user.id }, { $set: { lastLoginAt: new Date() } });
    return this.findOne(user.id);
  }

  async update(id: number | string, updateUserDto: UpdateUserDto): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'User');

    if (updateUserDto.roleId !== undefined) {
      await this.rolesService.findOne(updateUserDto.roleId);
    }
    if (updateUserDto.organizationId !== undefined && updateUserDto.organizationId !== null) {
      await this.organizationsService.findOne(updateUserDto.organizationId);
    }

    const payload: Record<string, unknown> = {};
    if (updateUserDto.username !== undefined) payload.username = updateUserDto.username;
    if (updateUserDto.fullName !== undefined) payload.fullName = updateUserDto.fullName;
    if (updateUserDto.email !== undefined) payload.email = updateUserDto.email;
    if (updateUserDto.phone !== undefined) payload.phone = updateUserDto.phone;
    if (updateUserDto.isActive !== undefined) payload.isActive = updateUserDto.isActive;
    if (updateUserDto.password !== undefined) payload.passwordHash = updateUserDto.password;
    if (updateUserDto.roleId !== undefined) payload.roleId = updateUserDto.roleId;
    if (Object.prototype.hasOwnProperty.call(updateUserDto, 'organizationId')) {
      payload.organizationId = updateUserDto.organizationId ?? null;
    }

    const user = await this.userModel
      .findOneAndUpdate({ id: numericId }, payload, { new: true, runValidators: true })
      .lean();

    if (!user) {
      throw new NotFoundException(`User ${numericId} not found`);
    }

    return this.mapUserWithLookups(user);
  }

  async remove(id: number | string): Promise<void> {
    const numericId = this.parseId(id, 'User');
    const result = await this.userModel.findOneAndDelete({ id: numericId }).lean();
    if (!result) {
      throw new NotFoundException(`User ${numericId} not found`);
    }
  }

  private async seedDefaults(): Promise<void> {
    const [roles, organizations] = await Promise.all([
      this.rolesService.findAll(),
      this.organizationsService.findAll(),
    ]);
    const roleByCode = new Map(roles.map((role) => [role.code, role]));
    const organizationByCode = new Map(organizations.map((organization) => [organization.code, organization]));

    const legacySuperadmin = await this.userModel.findOne({ username: 'superadmin' }).lean();
    const voenkomatRole = roleByCode.get('admin') ?? null;
    const defaultOrganization = organizationByCode.get('system-admin') ?? null;
    const existingVoenkomat = await this.userModel.findOne({ username: 'voenkomat' }).lean();
    const legacyCollegeUser = await this.userModel.findOne({ username: 'university' }).lean();
    const existingCollegeUser = await this.userModel.findOne({ username: 'kolleg3' }).lean();

    if (legacySuperadmin && !existingVoenkomat && voenkomatRole) {
      await this.userModel.updateOne(
        { username: 'superadmin' },
        {
          $set: {
            username: 'voenkomat',
            passwordHash: 'Voenkomat2026',
            fullName: 'Военкомат',
            email: 'voenkomat@example.com',
            roleId: voenkomatRole.id,
            organizationId: defaultOrganization?.id ?? null,
            isActive: true,
          },
        },
      );
    }

    if (legacyCollegeUser && !existingCollegeUser) {
      await this.userModel.updateOne(
        { username: 'university' },
        {
          $set: {
            username: 'kolleg3',
            passwordHash: 'kolleg3',
            fullName: 'Сотрудник колледжа',
            email: 'kolleg3@example.com',
            organizationId: organizationByCode.get('college-3')?.id ?? null,
            isActive: true,
          },
        },
      );
    }

    for (const userSeed of USER_SEED) {
      const role = roleByCode.get(userSeed.roleCode);
      if (!role) {
        continue;
      }

      const organization = organizationByCode.get(userSeed.organizationCode) ?? null;
      const existing = await this.userModel.findOne({ username: userSeed.username }).lean();

      if (existing) {
        await this.userModel.updateOne(
          { username: userSeed.username },
          {
            $set: {
              passwordHash: userSeed.password,
              fullName: userSeed.fullName,
              email: `${userSeed.username}@example.com`,
              roleId: role.id,
              organizationId: organization?.id ?? null,
              isActive: true,
            },
          },
        );
        continue;
      }

      const nextId = await this.countersService.getNextSequence('users');
      await this.userModel.create({
        id: nextId,
        username: userSeed.username,
        passwordHash: userSeed.password,
        fullName: userSeed.fullName,
        email: `${userSeed.username}@example.com`,
        phone: null,
        roleId: role.id,
        organizationId: organization?.id ?? null,
        isActive: true,
        lastLoginAt: null,
      });
    }
  }

  private mapUser(
    user: Record<string, any>,
    roleById?: Map<number, Record<string, any>>,
    organizationById?: Map<number, Record<string, any>>,
  ): Record<string, unknown> {
    const role = roleById?.get(user.roleId);
    const organization = user.organizationId ? organizationById?.get(user.organizationId) : null;

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email ?? null,
      phone: user.phone ?? null,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt ?? null,
      roleId: role?.id ?? user.roleId,
      organizationId: organization?.id ?? user.organizationId ?? null,
      roleCode: role?.code ?? null,
      roleName: role?.name ?? null,
      organizationName: organization?.name ?? null,
    };
  }

  private async mapUserWithLookups(user: Record<string, any>): Promise<Record<string, unknown>> {
    const [roles, organizations] = await Promise.all([
      this.rolesService.findAll(),
      this.organizationsService.findAll(),
    ]);

    return this.mapUser(
      user,
      new Map(roles.map((role) => [role.id, role])),
      new Map(organizations.map((organization) => [organization.id, organization])),
    );
  }

  private parseId(id: number | string, entity: string): number {
    const numericId = typeof id === 'number' ? id : Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new NotFoundException(`${entity} ${id} not found`);
    }
    return numericId;
  }

  private async backfillMissingIds(): Promise<void> {
    const usersToFix = await this.userModel
      .find({
        $or: [{ id: { $exists: false } }, { roleId: { $type: 'objectId' } }, { organizationId: { $type: 'objectId' } }],
      })
      .lean();

    if (usersToFix.length === 0) {
      return;
    }

    const roles = await this.rolesService.findAll();
    const organizations = await this.organizationsService.findAll();
    const adminRole = roles.find((role) => role.code === 'admin') || roles[0] || null;
    const defaultOrganization = organizations[0] ?? null;

    for (const user of usersToFix) {
      const nextId = user.id ?? (await this.countersService.getNextSequence('users'));
      await this.userModel.updateOne(
        { _id: user._id },
        {
          $set: {
            id: nextId,
            roleId:
              typeof user.roleId === 'number'
                ? user.roleId
                : user.username === 'admin'
                  ? adminRole?.id ?? 1
                  : adminRole?.id ?? 1,
            organizationId:
              typeof user.organizationId === 'number'
                ? user.organizationId
                : user.organizationId == null
                  ? null
                  : defaultOrganization?.id ?? null,
          },
        },
      );
    }
  }
}
