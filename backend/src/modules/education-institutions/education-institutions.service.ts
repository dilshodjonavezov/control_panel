import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CountersService } from '../counters/counters.service';
import { CreateEducationInstitutionDto } from './dto/create-education-institution.dto';
import { UpdateEducationInstitutionDto } from './dto/update-education-institution.dto';
import { EDUCATION_INSTITUTION_SEED } from './education-institutions.seed';
import {
  EducationInstitution,
  EducationInstitutionDocument,
} from './schemas/education-institution.schema';

@Injectable()
export class EducationInstitutionsService implements OnModuleInit {
  constructor(
    @InjectModel(EducationInstitution.name)
    private readonly educationInstitutionModel: Model<EducationInstitutionDocument>,
    private readonly countersService: CountersService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.ENABLE_DOMAIN_SEEDS === 'true') {
      await this.seedDefaults();
    }
  }

  async create(dto: CreateEducationInstitutionDto): Promise<Record<string, unknown>> {
    const nextId = await this.countersService.getNextSequence('education_institutions');
    await this.educationInstitutionModel.create({
      id: nextId,
      name: dto.name,
      type: dto.type,
      address: dto.address ?? null,
      description: dto.description ?? null,
    });
    return this.findOne(nextId);
  }

  async findAll(filters: { type?: string; search?: string } = {}): Promise<Record<string, unknown>[]> {
    const query: FilterQuery<EducationInstitutionDocument> = {};
    if (filters.type?.trim()) query.type = filters.type.trim();
    if (filters.search?.trim()) query.name = { $regex: filters.search.trim(), $options: 'i' };

    const institutions = await this.educationInstitutionModel.find(query).sort({ id: 1 }).lean();
    return institutions.map((institution) => this.mapInstitution(institution));
  }

  async findOne(id: number | string): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'Education institution');
    const institution = await this.educationInstitutionModel.findOne({ id: numericId }).lean();
    if (!institution) {
      throw new NotFoundException(`Education institution ${numericId} not found`);
    }
    return this.mapInstitution(institution);
  }

  async update(id: number | string, dto: UpdateEducationInstitutionDto): Promise<Record<string, unknown>> {
    const numericId = this.parseId(id, 'Education institution');
    const institution = await this.educationInstitutionModel
      .findOneAndUpdate(
        { id: numericId },
        {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.type !== undefined ? { type: dto.type } : {}),
          ...(dto.address !== undefined ? { address: dto.address ?? null } : {}),
          ...(dto.description !== undefined ? { description: dto.description ?? null } : {}),
        },
        { new: true, runValidators: true },
      )
      .lean();
    if (!institution) {
      throw new NotFoundException(`Education institution ${numericId} not found`);
    }
    return this.mapInstitution(institution);
  }

  async remove(id: number | string): Promise<void> {
    const numericId = this.parseId(id, 'Education institution');
    const deleted = await this.educationInstitutionModel.findOneAndDelete({ id: numericId }).lean();
    if (!deleted) {
      throw new NotFoundException(`Education institution ${numericId} not found`);
    }
  }

  private mapInstitution(institution: Record<string, any>): Record<string, unknown> {
    return {
      id: institution.id,
      name: institution.name ?? null,
      type: institution.type ?? null,
      address: institution.address ?? null,
      description: institution.description ?? null,
    };
  }

  private async seedDefaults(): Promise<void> {
    for (const item of EDUCATION_INSTITUTION_SEED) {
      const existing = await this.educationInstitutionModel.findOne({ name: item.name, type: item.type }).lean();
      if (existing) {
        continue;
      }
      const nextId = await this.countersService.getNextSequence('education_institutions');
      await this.educationInstitutionModel.create({
        id: nextId,
        name: item.name,
        type: item.type,
        address: item.address ?? null,
        description: item.description ?? null,
      });
    }
  }

  private parseId(id: number | string, entity: string): number {
    const numericId = typeof id === 'number' ? id : Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new NotFoundException(`${entity} ${id} not found`);
    }
    return numericId;
  }
}

