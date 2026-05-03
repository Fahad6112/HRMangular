import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
    { path: 'login', renderMode: RenderMode.Client },
    { path: 'register', renderMode: RenderMode.Client },
    { path: 'change-password', renderMode: RenderMode.Client },
    { path: 'admin', renderMode: RenderMode.Client },
    { path: 'home', renderMode: RenderMode.Client },
    { path: 'employee', renderMode: RenderMode.Client },
    { path: '**', renderMode: RenderMode.Client }
];