import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditLogsService } from '../../modules/audit-logs/audit-logs.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const method = String(request.method || '').toUpperCase();
    const shouldAudit = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    if (!shouldAudit) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: async (result: unknown) => {
          const user = (request.user ?? {}) as Record<string, unknown>;
          const body = request.body && typeof request.body === 'object' ? { ...request.body } : null;
          if (body && 'password' in body) {
            body.password = '***';
          }

          const resultRecord = result as Record<string, unknown> | null;
          const targetId =
            (resultRecord?.id as number | undefined) ??
            (request.params?.id ? Number(request.params.id) : null);

          await this.auditLogsService.create({
            action: this.resolveAction(method),
            method,
            path: request.route?.path ? `${request.baseUrl}${request.route.path}` : request.originalUrl,
            userId: (user.id as number | undefined) ?? null,
            username: (user.username as string | undefined) ?? null,
            roleCode: (user.roleCode as string | undefined) ?? null,
            targetId: Number.isInteger(targetId) ? targetId : null,
            entity: this.resolveEntity(request.baseUrl),
            requestBody: body,
            statusCode: response.statusCode ?? null,
          });
        },
      }),
    );
  }

  private resolveAction(method: string): string {
    if (method === 'POST') return 'create';
    if (method === 'PUT' || method === 'PATCH') return 'update';
    if (method === 'DELETE') return 'delete';
    return 'unknown';
  }

  private resolveEntity(baseUrl?: string): string | null {
    if (!baseUrl) return null;
    const normalized = baseUrl.split('/').filter(Boolean);
    return normalized[normalized.length - 1] ?? null;
  }
}
