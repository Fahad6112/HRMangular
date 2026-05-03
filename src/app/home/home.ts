import { Component, OnInit, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './home.html',
    styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
    email: string = '';
    fullName: string = '';
    profileImage: string | null = null;
    apiUrl: string = 'https://localhost:7141';

    // menu
    showMenu: boolean = false;

    // edit profile
    showEditProfile: boolean = false;
    editFullName: string = '';
    selectedImage: File | null = null;
    imagePreview: string | null = null;
    updating: boolean = false;

    // change password
    showChangePassword: boolean = false;
    newPassword: string = '';
    confirmNewPassword: string = '';

    // messages
    errorMessage: string = '';
    successMessage: string = '';

    constructor(
        private router: Router,
        private cdr: ChangeDetectorRef,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {}

    ngOnInit() {
        if (!isPlatformBrowser(this.platformId)) return;

        const token = localStorage.getItem('token');
        if (!token) {
            this.router.navigate(['/login']);
            return;
        }

        this.email = localStorage.getItem('email') || '';
        this.fullName = localStorage.getItem('fullName') || '';
        this.profileImage = localStorage.getItem('profileImage') || null;
        this.editFullName = this.fullName;
        this.cdr.detectChanges();
    }

    toggleMenu() {
        this.showMenu = !this.showMenu;
        this.cdr.detectChanges();
    }

    openEditProfile() {
        this.showMenu = false;
        this.showEditProfile = true;
        this.showChangePassword = false;
        this.errorMessage = '';
        this.successMessage = '';
        this.cdr.detectChanges();
    }

    openChangePassword() {
        this.showMenu = false;
        this.showChangePassword = true;
        this.showEditProfile = false;
        this.errorMessage = '';
        this.successMessage = '';
        this.cdr.detectChanges();
    }

    closeModals() {
        this.showEditProfile = false;
        this.showChangePassword = false;
        this.showMenu = false;
        this.errorMessage = '';
        this.successMessage = '';
        this.cdr.detectChanges();
    }

    onImageSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.selectedImage = file;
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.imagePreview = e.target.result;
                this.cdr.detectChanges();
            };
            reader.readAsDataURL(file);
        }
    }

    updateProfile() {
        const token = localStorage.getItem('token');
        if (!this.editFullName) {
            this.errorMessage = 'Full name is required';
            this.cdr.detectChanges();
            return;
        }

        this.updating = true;
        this.errorMessage = '';
        this.successMessage = '';

        const formData = new FormData();
        formData.append('fullName', this.editFullName);
        if (this.selectedImage) {
            formData.append('profileImage', this.selectedImage);
        }

        fetch('https://localhost:7141/api/account/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        })
        .then(async response => {
            const data = await response.json();
            return { status: response.status, data };
        })
        .then(result => {
            this.updating = false;
            if (result.status === 200) {
                this.successMessage = 'Profile updated successfully!';
                this.fullName = result.data.fullName;
                this.profileImage = result.data.profileImage;
                localStorage.setItem('fullName', this.fullName);
                localStorage.setItem('profileImage', this.profileImage || '');
                this.cdr.detectChanges();
            } else {
                this.errorMessage = 'Failed to update profile.';
                this.cdr.detectChanges();
            }
        })
        .catch(error => {
            this.updating = false;
            this.errorMessage = 'Something went wrong.';
            this.cdr.detectChanges();
        });
    }

    changePassword() {
        if (!this.newPassword || !this.confirmNewPassword) {
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

        this.updating = true;
        this.errorMessage = '';
        this.successMessage = '';

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
            this.updating = false;
            if (result.status === 200) {
                this.successMessage = 'Password changed! Please login again.';
                setTimeout(() => {
                    this.logout();
                }, 2000);
            } else {
                this.errorMessage = 'Failed to change password.';
            }
            this.cdr.detectChanges();
        })
        .catch(error => {
            this.updating = false;
            this.errorMessage = 'Something went wrong.';
            this.cdr.detectChanges();
        });
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        localStorage.removeItem('fullName');
        localStorage.removeItem('profileImage');
        this.router.navigate(['/login']);
    }
}