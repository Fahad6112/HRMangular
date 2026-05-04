import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class EmployeeGuard {
    constructor(private router: Router) {}

    canActivate(): boolean {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        
        if (token && role === 'Employee') {
            return true;
        }
        
        this.router.navigate(['/login']);
        return false;
    }
}