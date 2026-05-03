import { Component, OnInit, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-admin',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe],
    templateUrl: './admin.html',
    styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {
    // users
    users: any[] = [];
    totalUsers: number = 0;
    totalPages: number = 0;
    currentPage: number = 1;
    pageSize: number = 10;
    searchText: string = '';
    currentStatus: string = 'active';
    loading: boolean = true;

    // profile
    email: string = '';
    fullName: string = '';
    profileImage: string | null = null;
    apiUrl: string = 'https://localhost:7141';

    // menu
    showMenu: boolean = false;

    // ✅ NEW: sidebar
    showSidebar: boolean = false;

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
    editErrorMessage: string = '';
    editSuccessMessage: string = '';

    // expose Math to template
    Math = Math;

    // search debounce
    private searchTimeout: any;

    constructor(
        private router: Router,
        private cdr: ChangeDetectorRef,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {}

    ngOnInit() {
        if (!isPlatformBrowser(this.platformId)) return;

        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token) {
            this.router.navigate(['/login']);
            return;
        }

        if (role !== 'Admin') {
            this.router.navigate(['/home']);
            return;
        }

        this.email = localStorage.getItem('email') || '';
        this.fullName = localStorage.getItem('fullName') || '';
        this.profileImage = localStorage.getItem('profileImage') || null;
        this.editFullName = this.fullName;

        this.loadUsers();
    }

    loadUsers() {
        const token = localStorage.getItem('token');
        this.loading = true;
        this.cdr.detectChanges();

        const params = new URLSearchParams({
            page: this.currentPage.toString(),
            pageSize: this.pageSize.toString(),
            search: this.searchText,
            status: this.currentStatus
        });

        fetch(`https://localhost:7141/api/admin/users?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            this.users = data.users;
            this.totalUsers = data.totalUsers;
            this.totalPages = data.totalPages;
            this.loading = false;
            this.cdr.detectChanges();
        })
        .catch(error => {
            this.errorMessage = 'Failed to load users.';
            this.loading = false;
            this.cdr.detectChanges();
        });
    }

    onSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.currentPage = 1;
            this.loadUsers();
        }, 500);
    }

    filterByStatus(status: string) {
        this.currentStatus = status;
        this.currentPage = 1;
        this.loadUsers();
    }

    changePage(page: number) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.loadUsers();
    }

    getPages(): number[] {
        const pages = [];
        for (let i = 1; i <= this.totalPages; i++) {
            pages.push(i);
        }
        return pages;
    }

    deactivateUser(id: string) {
        if (!confirm('Deactivate this user?')) return;
        const token = localStorage.getItem('token');

        fetch(`https://localhost:7141/api/admin/users/${id}/deactivate`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            this.successMessage = 'User deactivated successfully!';
            this.errorMessage = '';
            this.cdr.detectChanges();
            this.loadUsers();
        })
        .catch(error => {
            this.errorMessage = 'Failed to deactivate user.';
            this.cdr.detectChanges();
        });
    }

    restoreUser(id: string) {
        if (!confirm('Restore this user?')) return;
        const token = localStorage.getItem('token');

        fetch(`https://localhost:7141/api/admin/users/${id}/restore`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            this.successMessage = 'User restored successfully!';
            this.errorMessage = '';
            this.cdr.detectChanges();
            this.loadUsers();
        })
        .catch(error => {
            this.errorMessage = 'Failed to restore user.';
            this.cdr.detectChanges();
        });
    }

    deleteUser(id: string) {
        if (!confirm('Permanently delete this user? This cannot be undone!')) return;
        const token = localStorage.getItem('token');

        fetch(`https://localhost:7141/api/admin/users/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            this.successMessage = 'User permanently deleted!';
            this.errorMessage = '';
            this.cdr.detectChanges();
            this.loadUsers();
        })
        .catch(error => {
            this.errorMessage = 'Failed to delete user.';
            this.cdr.detectChanges();
        });
    }

    // ✅ Profile menu — toggle on click, close via overlay
    toggleMenu() {
        this.showMenu = !this.showMenu;
        this.cdr.detectChanges();
    }

    // ✅ NEW: Sidebar toggle
    toggleSidebar() {
        this.showSidebar = !this.showSidebar;
        this.cdr.detectChanges();
    }

    // ✅ NEW: for "User Dashboard" sidebar item (stays on admin page)
    goToDashboard() {
        this.router.navigate(['/admin']);
    }

    openEditProfile() {
        this.showMenu = false;
        this.showEditProfile = true;
        this.showChangePassword = false;
        this.editErrorMessage = '';
        this.editSuccessMessage = '';
        this.cdr.detectChanges();
    }

    openChangePassword() {
        this.showMenu = false;
        this.showChangePassword = true;
        this.showEditProfile = false;
        this.editErrorMessage = '';
        this.editSuccessMessage = '';
        this.cdr.detectChanges();
    }

    closeModals() {
        this.showEditProfile = false;
        this.showChangePassword = false;
        this.showMenu = false;
        this.editErrorMessage = '';
        this.editSuccessMessage = '';
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
            this.editErrorMessage = 'Full name is required';
            this.cdr.detectChanges();
            return;
        }

        this.updating = true;
        this.editErrorMessage = '';
        this.editSuccessMessage = '';

        const formData = new FormData();
        formData.append('fullName', this.editFullName);
        if (this.selectedImage) {
            formData.append('profileImage', this.selectedImage);
        }

        fetch('https://localhost:7141/api/account/profile', {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        })
        .then(async response => {
            const data = await response.json();
            return { status: response.status, data };
        })
        .then(result => {
            this.updating = false;
            if (result.status === 200) {
                this.editSuccessMessage = 'Profile updated successfully!';
                this.fullName = result.data.fullName;
                this.profileImage = result.data.profileImage;
                localStorage.setItem('fullName', this.fullName);
                localStorage.setItem('profileImage', this.profileImage || '');
                this.cdr.detectChanges();
            } else {
                this.editErrorMessage = 'Failed to update profile.';
                this.cdr.detectChanges();
            }
        })
        .catch(error => {
            this.updating = false;
            this.editErrorMessage = 'Something went wrong.';
            this.cdr.detectChanges();
        });
    }

    changePassword() {
        if (!this.newPassword || !this.confirmNewPassword) {
            this.editErrorMessage = 'Please fill in all fields';
            this.cdr.detectChanges();
            return;
        }

        if (this.newPassword !== this.confirmNewPassword) {
            this.editErrorMessage = 'Passwords do not match';
            this.cdr.detectChanges();
            return;
        }

        if (this.newPassword.length < 8) {
            this.editErrorMessage = 'Password must be at least 8 characters';
            this.cdr.detectChanges();
            return;
        }

        this.updating = true;
        this.editErrorMessage = '';
        this.editSuccessMessage = '';

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
                this.editSuccessMessage = 'Password changed! Logging out...';
                this.cdr.detectChanges();
                setTimeout(() => { this.logout(); }, 2000);
            } else {
                this.editErrorMessage = 'Failed to change password.';
                this.cdr.detectChanges();
            }
        })
        .catch(error => {
            this.updating = false;
            this.editErrorMessage = 'Something went wrong.';
            this.cdr.detectChanges();
        });
    }

    goToEmployees() {
        this.router.navigate(['/employee']);
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