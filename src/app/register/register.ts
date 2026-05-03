import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './register.html',
    styleUrl: './register.css'
})
export class RegisterComponent implements OnInit {
    name: string = '';
    email: string = '';
    password: string = '';
    confirmPassword: string = '';
    errorMessage: string = '';
    successMessage: string = '';
    loading: boolean = false;
    selectedImage: File | null = null;
    imagePreview: string | null = null;
    imageError: string = '';

    constructor(
        private router: Router,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {}

    ngOnInit() {
        if (!isPlatformBrowser(this.platformId)) return;

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

    onImageSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.selectedImage = file;
            this.imageError = ''; // ✅ clear error when image selected
            // show preview
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.imagePreview = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    register() {
        if (!isPlatformBrowser(this.platformId)) return;

        if (!this.name || !this.email || !this.password || !this.confirmPassword) {
            this.errorMessage = 'Please fill in all fields';
            return;
        }

        // ✅ Image required check
        if (!this.selectedImage) {
             this.imageError = 'Profile image is required';
             return;
        }

            this.imageError = ''; // clear error if image selected

        if (this.password !== this.confirmPassword) {
            this.errorMessage = 'Passwords do not match';
            return;
        }

        if (this.password.length < 8) {
            this.errorMessage = 'Password must be at least 8 characters';
            return;
        }

        this.loading = true;
        this.errorMessage = '';
        this.successMessage = '';

        // ✅ Use FormData to send image + text together
        const formData = new FormData();
        formData.append('name', this.name);
        formData.append('email', this.email);
        formData.append('password', this.password);
        formData.append('confirmPassword', this.confirmPassword);

        if (this.selectedImage) {
            formData.append('profileImage', this.selectedImage);
        }

        fetch('https://localhost:7141/api/account/register', {
            method: 'POST',
            body: formData
            // ✅ No Content-Type header — browser sets it automatically for FormData
        })
        .then(async response => {
            const data = await response.json();
            return { status: response.status, data };
        })
        .then(result => {
            this.loading = false;
            if (result.status === 200) {
                this.successMessage = 'Registration successful! Redirecting to login...';
                setTimeout(() => {
                    this.router.navigate(['/login']);
                }, 2000);
            } else {
                this.errorMessage = 'Registration failed. Email may already exist.';
            }
        })
        .catch(error => {
            this.loading = false;
            this.errorMessage = 'Something went wrong. Try again.';
        });
    }
}