import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        console.log('Interceptor called for:', req.url);
        
        const token = localStorage.getItem('token');
        console.log('Token found:', token ? 'Yes' : 'No');
        
        if (token) {
            const cloned = req.clone({
                headers: req.headers.set('Authorization', `Bearer ${token}`)
            });
            console.log('Authorization header added');
            return next.handle(cloned);
        }
        
        return next.handle(req);
    }
}