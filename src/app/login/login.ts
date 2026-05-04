import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './login.html',
    styleUrl: './login.css'
})
export class LoginComponent implements OnInit {
    email: string = '';
    password: string = '';
    errorMessage: string = '';
    loading: boolean = false;

    constructor(
        private router: Router,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {}

    ngOnInit() {
        if (!isPlatformBrowser(this.platformId)) return;

        // if already logged in redirect based on role
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        
        if (token) {
            this.redirectBasedOnRole(role);
        }
    }

    redirectBasedOnRole(role: string | null) {
        if (role === 'Admin') {
            this.router.navigate(['/admin']);
        } else if (role === 'Employee') {
            this.router.navigate(['/employee-dashboard']);
        } else {
            this.router.navigate(['/home']);
        }
    }

    login() {
        if (!isPlatformBrowser(this.platformId)) return;

        if (this.email === '' || this.password === '') {
            this.errorMessage = 'Please fill in all fields';
            return;
        }

        this.loading = true;
        this.errorMessage = '';

        // First try regular login (for Admin and regular users)
        fetch('https://localhost:7141/api/account/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: this.email,
                password: this.password
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.role);
                localStorage.setItem('email', data.email);
                localStorage.setItem('fullName', data.fullName || data.name);
                localStorage.setItem('profileImage', data.profileImage || '');

                // Redirect based on role
                if (data.role === 'Admin') {
                    this.router.navigate(['/admin']);
                } else if (data.role === 'Employee') {
                    this.router.navigate(['/employee-dashboard']);
                } else {
                    this.router.navigate(['/home']);
                }
                this.loading = false;
            } else {
                // If regular login fails, try employee login
                this.employeeLogin();
            }
        })
        .catch(error => {
            // Try employee login on error
            this.employeeLogin();
        });
    }

    employeeLogin() {
        fetch('https://localhost:7141/api/account/employee/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: this.email,
                password: this.password
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.role);
                localStorage.setItem('email', data.email);
                localStorage.setItem('fullName', data.fullName);
                localStorage.setItem('profileImage', data.profileImage || '');
                localStorage.setItem('employeeId', data.employeeId?.toString() || '');
                localStorage.setItem('designation', data.designation || '');

                // Redirect to Employee Dashboard
                this.router.navigate(['/employee-dashboard']);
            } else {
                this.errorMessage = data.message || 'Invalid email or password';
            }
            this.loading = false;
        })
        .catch(error => {
            console.error('Login error:', error);
            this.errorMessage = 'Something went wrong. Try again.';
            this.loading = false;
        });
    }
}