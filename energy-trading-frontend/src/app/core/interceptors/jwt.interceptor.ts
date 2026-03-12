import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { Router } from "@angular/router";
import { catchError, throwError } from "rxjs";

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const token = authService.getToken();

    const cloneReq = token ? req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
    }) : req;

    return next(cloneReq).pipe(
        catchError((error) => {
            if (error.status === 401) {
                authService.logout();
                router.navigate(['/login'], { queryParams: { reason: 'session_expired' } });
            }
            return throwError(() => error);
        })
    );
}