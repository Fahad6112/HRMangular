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

    constructor(
        private router: Router,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {}

    ngOnInit() {
        if (!isPlatformBrowser(this.platformId)) return;

        // if already logged in redirect
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        if (token) {
            if (role === 'Admin') {
                this.router.navigate(['/admin']);
            } else {
                this.router.navigate(['/home']);
            }
        }
    }

    login() {
        if (!isPlatformBrowser(this.platformId)) return;

        if (this.email === '' || this.password === '') {
            this.errorMessage = 'Please fill in all fields';
            return;
        }

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
                localStorage.setItem('fullName', data.name);
                localStorage.setItem('profileImage', data.profileImage || '');

                if (data.role === 'Admin') {
                    this.router.navigate(['/admin']);
                } else {
                    this.router.navigate(['/home']);
                }
            } else {
                this.errorMessage = 'Invalid email or password';
            }
        })
        .catch(error => {
            this.errorMessage = 'Something went wrong. Try again.';
        });
    }
}