import { Component, OnInit, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

@Component({
    selector: 'app-change-password',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './change-password.html',
    styleUrl: './change-password.css'
})
export class ChangePasswordComponent implements OnInit {
    email: string = '';
    newPassword: string = '';
    confirmNewPassword: string = '';
    errorMessage: string = '';
    successMessage: string = '';
    loading: boolean = false;

    constructor(
        private router: Router,
        private cdr: ChangeDetectorRef,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {}

    ngOnInit() {
        if (!isPlatformBrowser(this.platformId)) return;
    }

    changePassword() {
        if (!isPlatformBrowser(this.platformId)) return;

        if (!this.email || !this.newPassword || !this.confirmNewPassword) {
            this.errorMessage = 'Please fill in all fields';
            this.cdr.detectChanges();
            return;
        }

        if (this.newPassword !== this.confirmNewPassword) {
            this.errorMessage = 'Passwords do not match';
            this.cdr.detectChanges();
            return;
        }

        if (this.newPassword.length < 8) {
            this.errorMessage = 'Password must be at least 8 characters';
            this.cdr.detectChanges();
            return;
        }

        this.loading = true;
        this.errorMessage = '';
        this.successMessage = '';
        this.cdr.detectChanges();

        fetch('https://localhost:7141/api/account/changepassword', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: this.email,
                newPassword: this.newPassword,
                confirmNewPassword: this.confirmNewPassword
            })
        })
        .then(async response => {
            const data = await response.json();
            return { status: response.status, data };
        })
        .then(result => {
            this.loading = false;

            if (result.status === 404) {
                this.errorMessage = 'Email is not registered!';
            } else if (result.status === 200) {
                this.successMessage = 'Password changed! Redirecting to login...';
                setTimeout(() => {
                    this.router.navigate(['/login']);
                }, 2000);
            } else {
                this.errorMessage = 'Failed to change password. Try again.';
            }

            this.cdr.detectChanges();
        })
        .catch(error => {
            this.loading = false;
            this.errorMessage = 'Something went wrong. Try again.';
            this.cdr.detectChanges();
        });
    }
}