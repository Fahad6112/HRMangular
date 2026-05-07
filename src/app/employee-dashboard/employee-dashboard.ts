import { Component, OnInit, PLATFORM_ID, Inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-employee-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe, CurrencyPipe],
    templateUrl: './employee-dashboard.html',
    styleUrls: ['./employee-dashboard.css']
})
export class EmployeeDashboardComponent implements OnInit {
    apiUrl: string = 'https://localhost:7141';
    
    // Employee Data
    employeeId: number = 0;
    email: string = '';
    fullName: string = '';
    phone: string = '';
    address: string = '';
    profileImage: string | null = null;
    designation: string = '';
    salary: number = 0;
    departmentName: string = '';
    joiningDate: Date | null = null;
    isActive: boolean = true;
    
    // Dashboard Stats
    attendanceSummary: any = {};
    pendingTasksCount: number = 0;
    completedTasksCount: number = 0;
    totalTasksCount: number = 0;
    pendingLeavesCount: number = 0;
    
    // Attendance
    isCheckedIn: boolean = false;
    isCheckedOut: boolean = false;
    lastCheckInTime: Date | null = null;
    lastCheckOutTime: Date | null = null;
    todayWorkHours: number = 0;
    attendanceHistory: any[] = [];
    selectedMonth: number = new Date().getMonth() + 1;
    selectedYear: number = new Date().getFullYear();
    
    // Tasks
    tasks: any[] = [];
    taskFilter: string = '';
    
    // Leaves
    leaves: any[] = [];
    showLeaveModal: boolean = false;
    leaveRequest: any = {
        leaveType: 'Annual',
        startDate: '',
        endDate: '',
        reason: ''
    };
    submitting: boolean = false;
    leaveError: string = '';
    
    // Profile Edit
    showEditProfile: boolean = false;
    editFullName: string = '';
    editPhone: string = '';
    editAddress: string = '';
    selectedImage: File | null = null;
    imagePreview: string | null = null;
    updating: boolean = false;
    profileError: string = '';
    profileSuccess: string = '';
    
    // Change Password
    showChangePassword: boolean = false;
    currentPassword: string = '';
    newPassword: string = '';
    confirmPassword: string = '';
    changingPassword: boolean = false;
    passwordError: string = '';
    passwordSuccess: string = '';
    
    // UI State
    showMenu: boolean = false;
    showSidebar: boolean = false;
    activeTab: string = '';
    showHomePage: boolean = true;
    
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
        
        if (role !== 'Employee') {
            this.router.navigate(['/home']);
            return;
        }
        
        // CRITICAL: Set initial state to show welcome page
        this.showHomePage = true;
        this.activeTab = '';
        
        // Load data in background (doesn't affect welcome page visibility)
        this.loadProfile();
        this.loadDashboardStats();
        this.loadTodayAttendance();
        
        // Load tasks and leaves in background but don't show them
        this.loadTasksBackground();
        this.loadLeavesBackground();
    }
    
    // Background data loading - doesn't change UI
    loadTasksBackground() {
        const token = localStorage.getItem('token');
        const url = `https://localhost:7141/api/employee-dashboard/tasks`;
        
        fetch(url, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            this.tasks = Array.isArray(data) ? data : [];
            this.cdr.detectChanges();
        })
        .catch(error => {
            console.error('Error loading tasks:', error);
            this.tasks = [];
        });
    }
    
    loadLeavesBackground() {
        const token = localStorage.getItem('token');
        
        fetch('https://localhost:7141/api/employee-dashboard/leaves', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            this.leaves = data;
            this.cdr.detectChanges();
        })
        .catch(error => console.error('Error loading leaves:', error));
    }

    // ==================== CLICK OUTSIDE HANDLER ====================
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: any) {
        const profileWrapper = document.querySelector('.profile-wrapper');
        const profileMenu = document.querySelector('.profile-menu');
        
        if (this.showMenu && 
            profileWrapper && !profileWrapper.contains(event.target as Node) && 
            profileMenu && !profileMenu.contains(event.target as Node)) {
            this.showMenu = false;
            this.cdr.detectChanges();
        }
    }

    // ==================== SIDEBAR METHODS ====================
    toggleSidebar() {
        this.showSidebar = !this.showSidebar;
        this.showMenu = false;
        this.cdr.detectChanges();
    }
    
    closeSidebar() {
        this.showSidebar = false;
        this.cdr.detectChanges();
    }
    
    // Go to Home/Welcome Page - Called when clicking HRMApp brand
    goToHome() {
        this.showHomePage = true;
        this.activeTab = '';
        this.showSidebar = false;
        this.showMenu = false;
        this.cdr.detectChanges();
    }
    
    // ==================== PROFILE MENU METHODS ====================
    toggleMenu() {
        this.showMenu = !this.showMenu;
        this.showSidebar = false;
        this.cdr.detectChanges();
    }
    
    openEditProfile() {
        this.showMenu = false;
        this.showEditProfile = true;
        this.showChangePassword = false;
        this.profileError = '';
        this.profileSuccess = '';
        this.editFullName = this.fullName;
        this.editPhone = this.phone || '';
        this.editAddress = this.address || '';
        this.selectedImage = null;
        this.imagePreview = null;
        this.cdr.detectChanges();
    }
    
    openChangePassword() {
        this.showMenu = false;
        this.showChangePassword = true;
        this.showEditProfile = false;
        this.passwordError = '';
        this.passwordSuccess = '';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.cdr.detectChanges();
    }
    
    closeModals() {
        this.showEditProfile = false;
        this.showChangePassword = false;
        this.showLeaveModal = false;
        this.showMenu = false;
        this.profileError = '';
        this.passwordError = '';
        this.leaveError = '';
        this.cdr.detectChanges();
    }
    
    // ==================== LOAD DATA METHODS (For sidebar navigation) ====================
    loadProfile() {
        const token = localStorage.getItem('token');
        
        fetch('https://localhost:7141/api/employee-dashboard/profile', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            this.employeeId = data.id;
            this.fullName = data.name;
            this.email = data.email;
            this.phone = data.phone || '';
            this.address = data.address || '';
            this.profileImage = data.photo;
            this.designation = data.designation;
            this.salary = data.salary;
            this.departmentName = data.departmentName;
            this.joiningDate = data.joiningDate;
            this.isActive = data.isActive;
            
            localStorage.setItem('fullName', this.fullName);
            localStorage.setItem('email', this.email);
            localStorage.setItem('profileImage', this.profileImage || '');
            localStorage.setItem('designation', this.designation);
            
            this.editFullName = this.fullName;
            this.editPhone = this.phone;
            this.editAddress = this.address;
            
            this.cdr.detectChanges();
        })
        .catch(error => console.error('Error loading profile:', error));
    }
    
    loadDashboardStats() {
        const token = localStorage.getItem('token');
        
        fetch('https://localhost:7141/api/employee-dashboard/dashboard/stats', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            this.attendanceSummary = data.attendanceSummary;
            this.pendingTasksCount = data.pendingTasksCount;
            this.completedTasksCount = data.completedTasksCount;
            this.totalTasksCount = data.totalTasksCount;
            this.pendingLeavesCount = data.pendingLeavesCount;
            this.cdr.detectChanges();
        })
        .catch(error => console.error('Error loading stats:', error));
    }
    
    loadTodayAttendance() {
        const token = localStorage.getItem('token');
        
        fetch('https://localhost:7141/api/employee-dashboard/attendance/today', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            if (data.data) {
                this.isCheckedIn = data.data.checkInTime != null;
                this.isCheckedOut = data.data.checkOutTime != null;
                this.lastCheckInTime = data.data.checkInTime;
                this.lastCheckOutTime = data.data.checkOutTime;
                this.todayWorkHours = data.data.totalWorkHours || 0;
            }
            this.cdr.detectChanges();
        })
        .catch(error => console.error('Error loading attendance:', error));
    }
    
    loadAttendanceHistory() {
        const token = localStorage.getItem('token');
        
        // Hide welcome page and show attendance history
        this.showHomePage = false;
        this.activeTab = 'attendance';
        this.showSidebar = false;
        
        fetch(`https://localhost:7141/api/employee-dashboard/attendance/history?month=${this.selectedMonth}&year=${this.selectedYear}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            this.attendanceHistory = data.history;
            this.cdr.detectChanges();
        })
        .catch(error => console.error('Error loading attendance history:', error));
    }
    
    loadTasks() {
        const token = localStorage.getItem('token');
        const statusParam = this.taskFilter ? `?status=${this.taskFilter}` : '';
        const url = `https://localhost:7141/api/employee-dashboard/tasks${statusParam}`;
        
        // Hide welcome page and show tasks
        this.showHomePage = false;
        this.activeTab = 'tasks';
        this.showSidebar = false;
        
        fetch(url, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            this.tasks = Array.isArray(data) ? data : [];
            this.cdr.detectChanges();
        })
        .catch(error => {
            console.error('Error loading tasks:', error);
            this.tasks = [];
            this.cdr.detectChanges();
        });
    }
    
    loadLeaves() {
        const token = localStorage.getItem('token');
        
        // Hide welcome page and show leaves
        this.showHomePage = false;
        this.activeTab = 'leaves';
        this.showSidebar = false;
        
        fetch('https://localhost:7141/api/employee-dashboard/leaves', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            this.leaves = data;
            this.cdr.detectChanges();
        })
        .catch(error => console.error('Error loading leaves:', error));
    }
    
    showProfile() {
        // Hide welcome page and show profile
        this.showHomePage = false;
        this.activeTab = 'profile';
        this.showSidebar = false;
        this.cdr.detectChanges();
    }
    
    // ==================== ATTENDANCE ACTIONS ====================
    checkIn() {
        const token = localStorage.getItem('token');
        
        fetch('https://localhost:7141/api/employee-dashboard/attendance/checkin', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            this.loadTodayAttendance();
            this.loadDashboardStats();
            this.cdr.detectChanges();
        })
        .catch(error => {
            console.error('Error checking in:', error);
            alert('Failed to check in');
        });
    }
    
    checkOut() {
        const token = localStorage.getItem('token');
        
        fetch('https://localhost:7141/api/employee-dashboard/attendance/checkout', {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            this.loadTodayAttendance();
            this.loadDashboardStats();
            this.cdr.detectChanges();
        })
        .catch(error => {
            console.error('Error checking out:', error);
            alert('Failed to check out');
        });
    }
    
    // ==================== TASK ACTIONS ====================
    updateTaskStatus(taskId: number, event: any) {
        const token = localStorage.getItem('token');
        const status = event.target.value;
        
        fetch(`https://localhost:7141/api/employee-dashboard/tasks/${taskId}/update-status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: status })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            this.loadTasks();
            this.loadDashboardStats();
            this.cdr.detectChanges();
        })
        .catch(error => console.error('Error updating task:', error));
    }
    
    isOverdue(dueDate: string): boolean {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date();
    }
    
    // ==================== LEAVE ACTIONS ====================
    openApplyLeave() {
        this.leaveRequest = {
            leaveType: 'Annual',
            startDate: '',
            endDate: '',
            reason: ''
        };
        this.leaveError = '';
        this.showLeaveModal = true;
        this.cdr.detectChanges();
    }
    
    submitLeave() {
        if (!this.leaveRequest.startDate || !this.leaveRequest.endDate || !this.leaveRequest.reason) {
            this.leaveError = 'Please fill in all fields';
            return;
        }
        
        this.submitting = true;
        const token = localStorage.getItem('token');
        
        fetch('https://localhost:7141/api/employee-dashboard/leaves/apply', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.leaveRequest)
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            this.submitting = false;
            this.showLeaveModal = false;
            this.loadLeaves();
            this.loadDashboardStats();
            this.cdr.detectChanges();
        })
        .catch(error => {
            console.error('Error applying leave:', error);
            this.leaveError = 'Failed to apply for leave';
            this.submitting = false;
            this.cdr.detectChanges();
        });
    }
    
    cancelLeave(leaveId: number) {
        if (!confirm('Are you sure you want to cancel this leave application?')) return;
        
        const token = localStorage.getItem('token');
        
        fetch(`https://localhost:7141/api/employee-dashboard/leaves/${leaveId}/cancel`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            this.loadLeaves();
            this.loadDashboardStats();
            this.cdr.detectChanges();
        })
        .catch(error => console.error('Error cancelling leave:', error));
    }
    
    // ==================== PROFILE UPDATE ACTIONS ====================
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
            this.profileError = 'Full name is required';
            return;
        }
        
        this.updating = true;
        this.profileError = '';
        this.profileSuccess = '';
        
        const formData = new FormData();
        formData.append('fullName', this.editFullName);
        formData.append('phone', this.editPhone);
        formData.append('address', this.editAddress);
        if (this.selectedImage) {
            formData.append('photo', this.selectedImage);
        }
        
        fetch('https://localhost:7141/api/employee-dashboard/profile', {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        })
        .then(async response => {
            const data = await response.json();
            if (response.ok) {
                this.profileSuccess = 'Profile updated successfully!';
                setTimeout(() => {
                    this.closeModals();
                    this.loadProfile();
                }, 2000);
            } else {
                this.profileError = data.message || 'Failed to update profile';
            }
            this.updating = false;
            this.cdr.detectChanges();
        })
        .catch(error => {
            this.profileError = 'Something went wrong';
            this.updating = false;
            this.cdr.detectChanges();
        });
    }
    
    changePassword() {
        if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
            this.passwordError = 'Please fill in all fields';
            return;
        }
        
        if (this.newPassword.length < 6) {
            this.passwordError = 'New password must be at least 6 characters';
            return;
        }
        
        if (this.newPassword !== this.confirmPassword) {
            this.passwordError = 'New passwords do not match';
            return;
        }
        
        this.changingPassword = true;
        this.passwordError = '';
        this.passwordSuccess = '';
        
        const token = localStorage.getItem('token');
        
        fetch('https://localhost:7141/api/employee-dashboard/change-password', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: this.email,
                currentPassword: this.currentPassword,
                newPassword: this.newPassword,
                confirmNewPassword: this.confirmPassword
            })
        })
        .then(async response => {
            const data = await response.json();
            if (response.ok) {
                this.passwordSuccess = data.message;
                setTimeout(() => {
                    this.closeModals();
                    setTimeout(() => {
                        this.logout();
                    }, 2000);
                }, 2000);
            } else {
                this.passwordError = data.message || 'Failed to change password';
            }
            this.changingPassword = false;
            this.cdr.detectChanges();
        })
        .catch(error => {
            this.passwordError = 'Something went wrong';
            this.changingPassword = false;
            this.cdr.detectChanges();
        });
    }
    
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        localStorage.removeItem('fullName');
        localStorage.removeItem('profileImage');
        localStorage.removeItem('employeeId');
        localStorage.removeItem('designation');
        this.showMenu = false;
        this.router.navigate(['/login']);
    }
}