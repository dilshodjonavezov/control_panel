import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CountersService } from '../counters/counters.service';
import { ORGANIZATION_SEED } from './organization.seed';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Organization, OrganizationDocument } from './schemas/organization.schema';

@Injectable()
export class OrganizationsService implements OnModuleInit {
  constructor(
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
    private readonly countersService: CountersService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.backfillMissingIds();
    await this.seedDefaults();
  }

  async create(createOrganizationDto: CreateOrganizationDto): Promise<Organization> {
    const nextId = await this.countersService.getNextSequence('organizations');
    const created = await this.organizationModel.create({
      id: nextId,
      ...createOrganizationDto,
      addressText: createOrganizationDto.addressText ?? null,
      isActive: createOrganizationDto.isActive ?? true,
    });
    return this.mapOrganization(created.toObject());
  }

  async findAll(): Promise<Organization[]> {
    const organizations = await this.organizationModel.find().sort({ name: 1 }).lean();
    return organizations.map((organization) => this.mapOrganization(organization));
  }

  async findOne(id: number | string): Promise<Organization> {
    const numericId = this.parseId(id, 'Organization');
    const organization = await this.organizationModel.findOne({ id: numericId }).lean();
    if (!organization) {
      throw new NotFoundException(`Organization ${numericId} not found`);
    }
    return this.mapOrganization(organization);
  }

  async update(id: number | string, updateOrganizationDto: UpdateOrganizationDto): Promise<Organization> {
    const numericId = this.parseId(id, 'Organization');
    const organization = await this.organizationModel
      .findOneAndUpdate({ id: numericId }, updateOrganizationDto, { new: true, runValidators: true })
      .lean();
    if (!organization) {
      throw new NotFoundException(`Organization ${numericId} not found`);
    }
    return this.mapOrganization(organization);
  }

  async remove(id: number | string): Promise<void> {
    const numericId = this.parseId(id, 'Organization');
    const result = await this.organizationModel.findOneAndDelete({ id: numericId }).lean();
    if (!result) {
      throw new NotFoundException(`Organization ${numericId} not found`);
    }
  }

  private parseId(id: number | string, entity: string): number {
    const numericId = typeof id === 'number' ? id : Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new NotFoundException(`${entity} ${id} not found`);
    }
    return numericId;
  }

  private mapOrganization(organization: Record<string, any>): Organization {
    return {
      id: organization.id,
      type: organization.type,
      code: organization.code,
      name: organization.name,
      addressText: organization.addressText ?? null,
      isActive: organization.isActive,
    } as Organization;
  }

  private async backfillMissingIds(): Promise<void> {
    const organizationsWithoutIds = await this.organizationModel.find({ id: { $exists: false } }).lean();
    for (const organization of organizationsWithoutIds) {
      const nextId = await this.countersService.getNextSequence('organizations');
      await this.organizationModel.updateOne({ _id: organization._id }, { $set: { id: nextId } });
    }
  }

  private async seedDefaults(): Promise<void> {
    for (const organization of ORGANIZATION_SEED) {
      const existing = await this.organizationModel.findOne({ code: organization.code }).lean();
      if (!existing) {
        const nextId = await this.countersService.getNextSequence('organizations');
        await this.organizationModel.create({
          id: nextId,
          ...organization,
          isActive: true,
        });
      }
    }
  }
}
