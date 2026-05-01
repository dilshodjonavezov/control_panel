import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

const TOKEN_STORAGE_KEY = 'auth_token';
const IMPERSONATED_USER_ID_STORAGE_KEY = 'auth_impersonated_user_id';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const impersonatedUserId = localStorage.getItem(IMPERSONATED_USER_ID_STORAGE_KEY);
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token && !impersonatedUserId) {
    return next(req);
  }

  const isApiCall =
    req.url.startsWith('/api/')
    || req.url.startsWith(`${environment.apiBaseUrl}/api/`);

  const isLoginCall = req.url.includes('/api/auth/login');
  if (!isApiCall || isLoginCall) {
    return next(req);
  }

  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req.clone({
        setHeaders: {
          'x-user-id': impersonatedUserId ?? '',
        },
      });

  return next(authReq);
};
