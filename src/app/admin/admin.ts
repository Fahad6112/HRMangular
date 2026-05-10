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
    // Users
    users: any[] = [];
    totalUsers: number = 0;
    totalPages: number = 0;
    currentPage: number = 1;
    pageSize: number = 10;
    searchText: string = '';
    currentStatus: string = 'active';
    loading: boolean = true;
    
    // Employee List Properties
    employeeList: any[] = [];
    empLoading: boolean = false;
    empError: string = '';
    empSuccess: string = '';
    empSaving: boolean = false;
    departments: any[] = [];
    newEmployee: any = {
        name: '', email: '', phone: '', address: '', designation: '', salary: 0,
        departmentId: '', joiningDate: new Date().toISOString().split('T')[0], temporaryPassword: ''
    };

    // Profile
    email: string = '';
    fullName: string = '';
    profileImage: string | null = null;
    apiUrl: string = 'https://localhost:7141';

    // Menu & Sidebar
    showMenu: boolean = false;
    showSidebar: boolean = false;

    // Edit Profile
    showEditProfile: boolean = false;
    editFullName: string = '';
    selectedImage: File | null = null;
    imagePreview: string | null = null;
    updating: boolean = false;

    // Change Password
    showChangePassword: boolean = false;
    newPassword: string = '';
    confirmNewPassword: string = '';

    // Messages
    errorMessage: string = '';
    successMessage: string = '';
    editErrorMessage: string = '';
    editSuccessMessage: string = '';

    // Content Management
    activeContent: string = '';
    showHomePage: boolean = true;

    // Task Management
    adminTasks: any[] = [];
    showTaskModal: boolean = false;
    newTask: any = {
        employeeId: '',
        title: '',
        description: '',
        priority: 'Medium',
        dueDate: ''
    };
    assigning: boolean = false;
    taskError: string = '';

    // Leave Management
    leaveRequests: any[] = [];
    pendingLeavesCount: number = 0;
    
    // Leave History
    leaveHistory: any[] = [];
    historyFilterStatus: string = '';
    historyStartDate: string = '';
    historyEndDate: string = '';

    // Attendance Management
    allAttendances: any[] = [];
    attendanceDate: string = new Date().toISOString().split('T')[0];

    // Employees list for task assignment
    employees: any[] = [];

    // Collapsible Sidebar Sections - all collapsed initially
    expandedSections: any = {
        management: false,
        tasks: false,
        leaves: false,
        attendance: false
    };

    // Expose Math to template
    Math = Math;
    private searchTimeout: any;

    constructor(
        private router: Router,
        private cdr: ChangeDetectorRef,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {}

    activeMenu: string = ''; // Track which subitem is active
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

        // Set initial state - show welcome page
        this.showHomePage = true;
        this.activeContent = '';

        // Load data
        this.loadUsers();
        this.loadEmployees();
        this.loadDepartments();
        this.loadAdminTasks();
        this.loadAllAttendance();
        this.loadPendingLeaves();
        this.loadLeaveHistory();
    }

    // ==================== HELPER METHODS ====================
    getActiveUsersCount(): number {
        return this.users.filter(u => u.isActive).length;
    }

    getActiveEmployeesCount(): number {
        return this.employeeList.filter(e => e.isActive).length;
    }

    // ==================== GO TO HOME (Welcome Page) ====================
    goToHome() {
        this.showHomePage = true;
        this.activeContent = '';
        this.showSidebar = false;
        this.cdr.detectChanges();
    }

    // ==================== MENU CLICK HANDLER ====================
    onMenuClick(menuItem: string) {
        console.log('Menu clicked:', menuItem);
        this.showHomePage = false;
        this.activeContent = menuItem;
        this.showSidebar = false;
        
        switch(menuItem) {
            case 'employees':
                this.loadEmployeesList();
                break;
            case 'createemployee':
                this.resetNewEmployeeForm();
                break;
            case 'tasks':
                this.loadAdminTasks();
                break;
            case 'leaverequests':
                this.loadPendingLeaves();
                break;
            case 'leavehistory':
                this.loadLeaveHistory();
                break;
            case 'attendance':
                this.loadAllAttendance();
                break;
        }
    }

    // ==================== TOGGLE SIDEBAR SECTIONS ====================
    toggleSection(section: string) {
        this.expandedSections[section] = !this.expandedSections[section];
        this.cdr.detectChanges();
    }

    // ==================== EMPLOYEE LIST METHODS ====================
    loadEmployeesList() {
        const token = localStorage.getItem('token');
        this.empLoading = true;
        this.cdr.detectChanges();
        
        fetch('https://localhost:7141/api/employees?pageSize=100', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            this.employeeList = data.employees || [];
            this.empLoading = false;
            this.cdr.detectChanges();
        })
        .catch(error => {
            console.error('Error loading employees:', error);
            this.empLoading = false;
            this.cdr.detectChanges();
        });
    }

    loadDepartments() {
        const token = localStorage.getItem('token');
        
        fetch('https://localhost:7141/api/employees/departments', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            this.departments = data;
            this.cdr.detectChanges();
        })
        .catch(error => console.error('Error loading departments:', error));
    }

    resetNewEmployeeForm() {
        this.newEmployee = {
            name: '', email: '', phone: '', address: '', designation: '', salary: 0,
            departmentId: '', joiningDate: new Date().toISOString().split('T')[0], temporaryPassword: ''
        };
        this.empError = '';
        this.empSuccess = '';
    }

    createEmployee() {
        if (!this.newEmployee.name || !this.newEmployee.email || !this.newEmployee.temporaryPassword) {
            this.empError = 'Please fill all required fields';
            return;
        }
        
        if (this.newEmployee.temporaryPassword.length < 6) {
            this.empError = 'Password must be at least 6 characters';
            return;
        }
        
        this.empSaving = true;
        this.empError = '';
        const token = localStorage.getItem('token');
        
        const formData = new FormData();
        formData.append('name', this.newEmployee.name);
        formData.append('email', this.newEmployee.email);
        formData.append('phone', this.newEmployee.phone);
        formData.append('address', this.newEmployee.address);
        formData.append('designation', this.newEmployee.designation);
        formData.append('salary', this.newEmployee.salary.toString());
        formData.append('departmentId', this.newEmployee.departmentId.toString());
        formData.append('joiningDate', this.newEmployee.joiningDate);
        formData.append('temporaryPassword', this.newEmployee.temporaryPassword);
        
        fetch('https://localhost:7141/api/employees', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        })
        .then(async response => {
            const data = await response.json();
            if (response.ok) {
                this.empSuccess = 'Employee created successfully!';
                setTimeout(() => {
                    this.onMenuClick('employees');
                }, 1500);
            } else {
                this.empError = data.message || 'Failed to create employee';
            }
            this.empSaving = false;
            this.cdr.detectChanges();
        })
        .catch(error => {
            console.error('Error:', error);
            this.empError = 'Something went wrong';
            this.empSaving = false;
            this.cdr.detectChanges();
        });
    }

    deleteEmployee(id: number) {
        if (!confirm('Are you sure you want to delete this employee?')) return;
        
        const token = localStorage.getItem('token');
        
        fetch(`https://localhost:7141/api/employees/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message || 'Employee deleted');
            this.loadEmployeesList();
            this.cdr.detectChanges();
        })
        .catch(error => {
            console.error('Error deleting employee:', error);
            alert('Failed to delete employee');
        });
    }

    // ==================== USER MANAGEMENT ====================
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

    // ==================== EMPLOYEE MANAGEMENT ====================
    loadEmployees() {
        const token = localStorage.getItem('token');
        
        fetch('https://localhost:7141/api/employees?pageSize=100', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            if (data.employees) {
                this.employees = data.employees;
            }
            this.cdr.detectChanges();
        })
        .catch(error => console.error('Error loading employees:', error));
    }

    // ==================== TASK MANAGEMENT ====================
    loadAdminTasks() {
        const token = localStorage.getItem('token');
        
        fetch('https://localhost:7141/api/admin/tasks/all', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            this.adminTasks = data;
            this.cdr.detectChanges();
        })
        .catch(error => console.error('Error loading tasks:', error));
    }

    openAssignTaskModal() {
        this.newTask = {
            employeeId: '',
            title: '',
            description: '',
            priority: 'Medium',
            dueDate: ''
        };
        this.taskError = '';
        this.showTaskModal = true;
        this.cdr.detectChanges();
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
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.newTask)
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            this.assigning = false;
            this.showTaskModal = false;
            this.loadAdminTasks();
            this.cdr.detectChanges();
        })
        .catch(error => {
            console.error('Error assigning task:', error);
            this.taskError = 'Failed to assign task';
            this.assigning = false;
            this.cdr.detectChanges();
        });
    }

    deleteTask(taskId: number) {
        if (!confirm('Are you sure you want to delete this task?')) return;
        
        const token = localStorage.getItem('token');
        
        fetch(`https://localhost:7141/api/admin/tasks/${taskId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            this.loadAdminTasks();
            this.cdr.detectChanges();
        })
        .catch(error => console.error('Error deleting task:', error));
    }

    isTaskOverdue(dueDate: string): boolean {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date();
    }

    // ==================== LEAVE MANAGEMENT ====================
    loadPendingLeaves() {
        const token = localStorage.getItem('token');
        
        fetch('https://localhost:7141/api/admin/leaves/pending', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            this.leaveRequests = data;
            this.pendingLeavesCount = data.length;
            this.cdr.detectChanges();
        })
        .catch(error => console.error('Error loading leaves:', error));
    }

    approveLeave(leaveId: number) {
        const remarks = prompt('Enter any remarks (optional):');
        
        const token = localStorage.getItem('token');
        
        fetch(`https://localhost:7141/api/admin/leaves/${leaveId}/approve`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ adminRemarks: remarks || '' })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            this.loadPendingLeaves();
            this.loadLeaveHistory();
            this.cdr.detectChanges();
        })
        .catch(error => console.error('Error approving leave:', error));
    }

    rejectLeave(leaveId: number) {
        const remarks = prompt('Enter rejection reason:');
        if (!remarks) return;
        
        const token = localStorage.getItem('token');
        
        fetch(`https://localhost:7141/api/admin/leaves/${leaveId}/reject`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ adminRemarks: remarks })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            this.loadPendingLeaves();
            this.loadLeaveHistory();
            this.cdr.detectChanges();
        })
        .catch(error => console.error('Error rejecting leave:', error));
    }

    // ==================== LEAVE HISTORY ====================
    loadLeaveHistory() {
        const token = localStorage.getItem('token');
        let url = 'https://localhost:7141/api/admin/leaves/all';
        const params: string[] = [];
        
        if (this.historyFilterStatus) {
            params.push(`status=${this.historyFilterStatus}`);
        }
        if (this.historyStartDate) {
            params.push(`startDate=${this.historyStartDate}`);
        }
        if (this.historyEndDate) {
            params.push(`endDate=${this.historyEndDate}`);
        }
        
        if (params.length > 0) {
            url += '?' + params.join('&');
        }
        
        fetch(url, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            this.leaveHistory = Array.isArray(data) ? data : [];
            this.cdr.detectChanges();
        })
        .catch(error => {
            console.error('Error loading leave history:', error);
            this.leaveHistory = [];
            this.cdr.detectChanges();
        });
    }

    resetHistoryFilters() {
        this.historyFilterStatus = '';
        this.historyStartDate = '';
        this.historyEndDate = '';
        this.loadLeaveHistory();
    }

    // ==================== ATTENDANCE MANAGEMENT ====================
    loadAllAttendance() {
        const token = localStorage.getItem('token');
        const url = this.attendanceDate ? 
            `https://localhost:7141/api/admin/attendance/all?date=${this.attendanceDate}` :
            'https://localhost:7141/api/admin/attendance/all';
        
        fetch(url, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            this.allAttendances = data;
            this.cdr.detectChanges();
        })
        .catch(error => console.error('Error loading attendance:', error));
    }

    // ==================== PROFILE & MENU ====================
    toggleMenu() {
        this.showMenu = !this.showMenu;
        this.cdr.detectChanges();
    }

    toggleSidebar() {
        this.showSidebar = !this.showSidebar;
        this.cdr.detectChanges();
    }

    goToDashboard() {
        this.router.navigate(['/admin']);
    }

    goToEmployees() {
        this.router.navigate(['/employee']);
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
        this.showTaskModal = false;
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
                setTimeout(() => {
                    this.closeModals();
                }, 2000);
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

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        localStorage.removeItem('fullName');
        localStorage.removeItem('profileImage');
        this.router.navigate(['/login']);
    }
}