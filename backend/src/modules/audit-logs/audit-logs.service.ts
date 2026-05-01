import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async create(entry: Partial<AuditLog>): Promise<void> {
    await this.auditLogModel.create({
      action: entry.action ?? 'unknown',
      method: entry.method ?? 'UNKNOWN',
      path: entry.path ?? '',
      userId: entry.userId ?? null,
      username: entry.username ?? null,
      roleCode: entry.roleCode ?? null,
      targetId: entry.targetId ?? null,
      entity: entry.entity ?? null,
      requestBody: entry.requestBody ?? null,
      statusCode: entry.statusCode ?? null,
    });
  }
}
