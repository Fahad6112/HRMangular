import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, RouterOutlet, FormsModule],
    templateUrl: './layout.html',
    styleUrls: ['./layout.css']
})
export class LayoutComponent implements OnInit {
    email: string = '';
    fullName: string = '';
    profileImage: string | null = null;
    apiUrl: string = 'https://localhost:7141';
    
    showMenu: boolean = false;
    showSidebar: boolean = false;
    activeMenu: string = '';
    expandedSections: any = {
        management: true,
        tasks: false,
        leaves: false,
        attendance: false
    };
    
    showEditProfile: boolean = false;
    showChangePassword: boolean = false;
    showTaskModal: boolean = false;
    
    editFullName: string = '';
    selectedImage: File | null = null;
    imagePreview: string | null = null;
    updating: boolean = false;
    editErrorMessage: string = '';
    editSuccessMessage: string = '';
    
    newPassword: string = '';
    confirmNewPassword: string = '';
    
    newTask: any = {
        employeeId: '',
        title: '',
        description: '',
        priority: 'Medium',
        dueDate: ''
    };
    assigning: boolean = false;
    taskError: string = '';
    employees: any[] = [];
    pendingLeavesCount: number = 0;

    constructor(private router: Router) {
        console.log('LayoutComponent constructor');
    }

    ngOnInit() {
        console.log('LayoutComponent ngOnInit');
        
        this.email = localStorage.getItem('email') || '';
        this.fullName = localStorage.getItem('fullName') || '';
        this.profileImage = localStorage.getItem('profileImage') || null;
        this.editFullName = this.fullName;
        
        console.log('User:', this.email, this.fullName);
        
        this.loadEmployees();
        this.loadPendingLeavesCount();
        
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
            this.updateActiveMenuFromUrl();
        });
        
        this.updateActiveMenuFromUrl();
    }

    updateActiveMenuFromUrl() {
        const url = this.router.url;
        if (url.includes('/admin/employeelist')) {
            this.activeMenu = 'employees';
        } else if (url.includes('/admin/createemployee')) {
            this.activeMenu = 'createemployee';
        } else if (url.includes('/admin/tasks')) {
            this.activeMenu = 'tasks';
        } else if (url.includes('/admin/leaverequests')) {
            this.activeMenu = 'leaverequests';
        } else if (url.includes('/admin/leavehistory')) {
            this.activeMenu = 'leavehistory';
        } else if (url.includes('/admin/attendance')) {
            this.activeMenu = 'attendance';
        }
    }

    loadEmployees() {
        const token = localStorage.getItem('token');
        if (!token) return;
        fetch('https://localhost:7141/api/employees?pageSize=100', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data.employees) this.employees = data.employees;
        })
        .catch(err => console.error(err));
    }

    loadPendingLeavesCount() {
        const token = localStorage.getItem('token');
        if (!token) return;
        fetch('https://localhost:7141/api/admin/leaves/pending', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            this.pendingLeavesCount = data.length;
        })
        .catch(err => console.error(err));
    }

    toggleMenu() {
        console.log('toggleMenu called, current:', this.showMenu);
        this.showMenu = !this.showMenu;
        console.log('toggleMenu new value:', this.showMenu);
    }

    toggleSidebar() {
        this.showSidebar = !this.showSidebar;
    }

    toggleSection(section: string) {
        this.expandedSections[section] = !this.expandedSections[section];
    }

    onMenuClick(menuItem: string) {
        console.log('onMenuClick:', menuItem);
        this.showSidebar = false;
        switch(menuItem) {
            case 'employees':
                this.router.navigate(['/admin/employeelist']);
                break;
            case 'createemployee':
                this.router.navigate(['/admin/createemployee']);
                break;
            case 'tasks':
                this.router.navigate(['/admin/tasks']);
                break;
            case 'leaverequests':
                this.router.navigate(['/admin/leaverequests']);
                break;
            case 'leavehistory':
                this.router.navigate(['/admin/leavehistory']);
                break;
            case 'attendance':
                this.router.navigate(['/admin/attendance']);
                break;
        }
    }

    goToHome() {
        this.router.navigate(['/admin']);
    }

    openEditProfile() {
        console.log('openEditProfile called');
        this.showMenu = false;
        this.showEditProfile = true;
        this.showChangePassword = false;
        this.editErrorMessage = '';
        this.editSuccessMessage = '';
    }

    openChangePassword() {
        console.log('openChangePassword called');
        this.showMenu = false;
        this.showChangePassword = true;
        this.showEditProfile = false;
        this.editErrorMessage = '';
        this.editSuccessMessage = '';
    }

    openAssignTaskModal() {
        this.showTaskModal = true;
        this.showSidebar = false;
    }

    closeModals() {
        console.log('closeModals called');
        this.showEditProfile = false;
        this.showChangePassword = false;
        this.showTaskModal = false;
        this.editErrorMessage = '';
        this.editSuccessMessage = '';
    }

    onImageSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.selectedImage = file;
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.imagePreview = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    updateProfile() {
        console.log('updateProfile called');
        if (!this.editFullName) {
            this.editErrorMessage = 'Full name is required';
            return;
        }

        this.updating = true;
        this.editErrorMessage = '';
        this.editSuccessMessage = '';
        const token = localStorage.getItem('token');

        const formData = new FormData();
        formData.append('fullName', this.editFullName);
        if (this.selectedImage) formData.append('profileImage', this.selectedImage);

        fetch('https://localhost:7141/api/account/profile', {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        })
        .then(async response => ({ status: response.status, data: await response.json() }))
        .then(result => {
            this.updating = false;
            if (result.status === 200) {
                this.editSuccessMessage = 'Profile updated successfully!';
                this.fullName = result.data.fullName;
                this.profileImage = result.data.profileImage;
                localStorage.setItem('fullName', this.fullName);
                localStorage.setItem('profileImage', this.profileImage || '');
                setTimeout(() => this.closeModals(), 2000);
            } else {
                this.editErrorMessage = result.data.message || 'Failed to update profile.';
            }
        })
        .catch(() => { 
            this.updating = false; 
            this.editErrorMessage = 'Something went wrong.'; 
        });
    }

    changePassword() {
        console.log('changePassword called');
        if (!this.newPassword || !this.confirmNewPassword) {
            this.editErrorMessage = 'Please fill in all fields';
            return;
        }
        if (this.newPassword !== this.confirmNewPassword) {
            this.editErrorMessage = 'Passwords do not match';
            return;
        }
        if (this.newPassword.length < 8) {
            this.editErrorMessage = 'Password must be at least 8 characters';
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
        .then(async response => ({ status: response.status, data: await response.json() }))
        .then(result => {
            this.updating = false;
            if (result.status === 200) {
                this.editSuccessMessage = 'Password changed! Logging out...';
                setTimeout(() => this.logout(), 2000);
            } else {
                this.editErrorMessage = result.data.message || 'Failed to change password.';
            }
        })
        .catch(() => { 
            this.updating = false; 
            this.editErrorMessage = 'Something went wrong.'; 
        });
    }

    assignTask() {
        if (!this.newTask.employeeId || !this.newTask.title || !this.newTask.description) {
            this.taskError = 'Please fill in all required fields';
            return;
        }

        this.assigning = true;
        const token = localStorage.getItem('token');

        fetch('https://localhost:7141/api/admin/tasks/assign', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(this.newTask)
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            this.assigning = false;
            this.showTaskModal = false;
            this.newTask = { employeeId: '', title: '', description: '', priority: 'Medium', dueDate: '' };
        })
        .catch(error => {
            console.error('Error assigning task:', error);
            this.taskError = 'Failed to assign task';
            this.assigning = false;
        });
    }

    logout() {
        console.log('logout called');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        localStorage.removeItem('fullName');
        localStorage.removeItem('profileImage');
        this.router.navigate(['/login']);
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.profile-wrapper') && !target.closest('.profile-menu')) {
            if (this.showMenu) {
                this.showMenu = false;
            }
        }
    }
}