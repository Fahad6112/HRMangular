import { Component, OnInit, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

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
        departmentId: '', joiningDate: new Date().toISOString().split('T')[0], temporaryPassword: '',
        gender: '', dateOfBirth: '', education: '', instituteName: ''
    };

    // Edit Employee Properties
    showEditEmployeeModal: boolean = false;
    editEmployeeData: any = {
        id: 0, name: '', email: '', phone: '', address: '', designation: '', salary: 0,
        departmentId: '', joiningDate: '', photo: '', gender: '', dateOfBirth: '', education: ''
    };
    editSelectedPhoto: File | null = null;
    editPhotoPreview: string | null = null;
    editEmployeeSaving: boolean = false;
    editEmployeeError: string = '';
    editEmployeeSuccess: string = '';

    // Employee List Pagination
    employeeSearchText: string = '';
    employeeDepartmentFilter: any = '';
    employeeStatusFilter: string = 'active';
    employeeCurrentPage: number = 1;
    employeePageSize: number = 10;
    employeeTotalEmployees: number = 0;
    employeeTotalPages: number = 0;
    private employeeSearchTimeout: any;
    
    // Document Properties
    employeeDocuments: any[] = [];
    documentFields: any[] = [];
    uploadingDocuments: boolean = false;
    showDocumentsModal: boolean = false;
    documentsLoading: boolean = false;
    selectedEmployeeName: string = '';

    // Profile - KEEP (used in template)
    email: string = '';
    fullName: string = '';
    profileImage: string | null = null;
    apiUrl: string = 'https://localhost:7141';

    // Menu & Sidebar
    activeMenu: string = '';

    // Messages
    errorMessage: string = '';
    successMessage: string = '';

    // Content Management
    activeContent: string = '';
    showHomePage: boolean = true;
    private lastActiveSection: string = 'management';
    
    // Task Management
    adminTasks: any[] = [];
    showTaskModal: boolean = false;
    newTask: any = { employeeId: '', title: '', description: '', priority: 'Medium', dueDate: '' };
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

    // Edit Employee Document Properties
    editEmployeeDocuments: any[] = [];
    editDocumentFields: any[] = [];
    editUploadingDocuments: boolean = false;

    // Collapsible Sidebar Sections
    expandedSections: any = { management: false, tasks: false, leaves: false, attendance: false };

    Math = Math;
    private searchTimeout: any;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {}

    ngOnInit() {
        if (!isPlatformBrowser(this.platformId)) return;

        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token) { this.router.navigate(['/login']); return; }
        if (role !== 'Admin') { this.router.navigate(['/home']); return; }

        this.email = localStorage.getItem('email') || '';
        this.fullName = localStorage.getItem('fullName') || '';
        this.profileImage = localStorage.getItem('profileImage') || null;

        this.loadUsers();
        this.loadEmployees();
        this.loadDepartments();
        this.loadAdminTasks();
        this.loadAllAttendance();
        this.loadPendingLeaves();
        this.loadLeaveHistory();

        this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
            this.handleRoute();
        });
        this.handleRoute();
    }

    // ==================== ROUTE HANDLING ====================
    handleRoute() {
        const currentUrl = this.router.url;
        
        if (currentUrl.includes('/admin/employeelist')) {
            this.showHomePage = false;
            this.activeContent = 'employees';
            this.activeMenu = 'employees';
            this.resetEmployeeFilters();
            this.expandedSections['management'] = true;
        } 
        else if (currentUrl.includes('/admin/createemployee')) {
            this.showHomePage = false;
            this.activeContent = 'createemployee';
            this.activeMenu = 'createemployee';
            this.resetNewEmployeeForm();
            this.expandedSections['management'] = true;
        }
        else if (currentUrl.includes('/admin/tasks')) {
            this.showHomePage = false;
            this.activeContent = 'tasks';
            this.activeMenu = 'tasks';
            this.loadAdminTasks();
            this.expandedSections['tasks'] = true;
        }
        else if (currentUrl.includes('/admin/leaverequests')) {
            this.showHomePage = false;
            this.activeContent = 'leaverequests';
            this.activeMenu = 'leaverequests';
            this.loadPendingLeaves();
            this.expandedSections['leaves'] = true;
        }
        else if (currentUrl.includes('/admin/leavehistory')) {
            this.showHomePage = false;
            this.activeContent = 'leavehistory';
            this.activeMenu = 'leavehistory';
            this.loadLeaveHistory();
            this.expandedSections['leaves'] = true;
        }
        else if (currentUrl.includes('/admin/attendance')) {
            this.showHomePage = false;
            this.activeContent = 'attendance';
            this.activeMenu = 'attendance';
            this.loadAllAttendance();
            this.expandedSections['attendance'] = true;
        }
        else {
            const returnToEmployees = localStorage.getItem('returnToEmployees');
            if (returnToEmployees === 'true') {
                localStorage.removeItem('returnToEmployees');
                this.showHomePage = false;
                this.activeContent = 'employees';
                this.activeMenu = 'employees';
                this.resetEmployeeFilters();
                this.expandedSections['management'] = true;
                this.router.navigate(['/admin/employeelist'], { replaceUrl: true });
            } else {
                this.showHomePage = true;
                this.activeContent = '';
                this.activeMenu = '';
            }
        }
        this.cdr.detectChanges();
    }

    // ==================== HELPER METHODS ====================
    getActiveUsersCount(): number { return this.users.filter(u => u.isActive).length; }
    getActiveEmployeesCount(): number { return this.employeeList.filter(e => e.isActive).length; }
    goToHome() { localStorage.removeItem('returnToEmployees'); this.router.navigate(['/admin']); }

    // ==================== EMPLOYEE LIST METHODS ====================
    loadEmployeesList() {
        const token = localStorage.getItem('token');
        this.empLoading = true;
        
        const params = new URLSearchParams();
        params.append('page', this.employeeCurrentPage.toString());
        params.append('pageSize', this.employeePageSize.toString());
        params.append('search', this.employeeSearchText);
        params.append('status', this.employeeStatusFilter);
        if (this.employeeDepartmentFilter) params.append('departmentId', this.employeeDepartmentFilter);
        
        fetch(`https://localhost:7141/api/employees?${params}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            this.employeeList = data.employees || [];
            this.employeeTotalEmployees = data.totalEmployees || 0;
            this.employeeTotalPages = data.totalPages || 0;
            this.empLoading = false;
            this.cdr.detectChanges();
        })
        .catch(error => { this.employeeList = []; this.empLoading = false; this.cdr.detectChanges(); });
    }

    onEmployeeSearch() {
        clearTimeout(this.employeeSearchTimeout);
        this.employeeSearchTimeout = setTimeout(() => {
            this.employeeCurrentPage = 1;
            this.loadEmployeesList();
        }, 500);
    }

    filterEmployeeByDepartment() { this.employeeCurrentPage = 1; this.loadEmployeesList(); }
    filterEmployeeByStatus(status: string) { this.employeeStatusFilter = status; this.employeeCurrentPage = 1; this.loadEmployeesList(); }
    resetEmployeeFilters() { this.employeeSearchText = ''; this.employeeDepartmentFilter = ''; this.employeeStatusFilter = 'active'; this.employeeCurrentPage = 1; this.loadEmployeesList(); }
    changeEmployeePage(page: number) { if (page < 1 || page > this.employeeTotalPages) return; this.employeeCurrentPage = page; this.loadEmployeesList(); }
    
    getEmployeePages(): number[] {
        const pages = [];
        const maxPages = 5;
        let startPage = Math.max(1, this.employeeCurrentPage - Math.floor(maxPages / 2));
        let endPage = Math.min(this.employeeTotalPages, startPage + maxPages - 1);
        if (endPage - startPage + 1 < maxPages) startPage = Math.max(1, endPage - maxPages + 1);
        for (let i = startPage; i <= endPage; i++) pages.push(i);
        return pages;
    }

    loadDepartments() {
        const token = localStorage.getItem('token');
        fetch('https://localhost:7141/api/employees/departments', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => { this.departments = data; this.cdr.detectChanges(); })
        .catch(err => console.error(err));
    }

    resetNewEmployeeForm() {
        this.newEmployee = {
            name: '', email: '', phone: '', address: '', designation: '', salary: 0,
            departmentId: '', joiningDate: new Date().toISOString().split('T')[0], temporaryPassword: '',
            gender: '', dateOfBirth: '', education: '', instituteName: ''
        };
        this.empError = '';
        this.empSuccess = '';
        this.employeeDocuments = [];
        this.documentFields = [];
    }

    // ==================== DOCUMENT METHODS ====================
    addDocumentField() { this.documentFields.push({ documentType: '', file: null, fileError: '' }); this.cdr.detectChanges(); }
    removeDocumentField(index: number) { this.documentFields.splice(index, 1); this.cdr.detectChanges(); }
    
    onDocumentSelected(event: any, index: number) {
        const file = event.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            this.documentFields[index].fileError = 'File size must be less than 5MB';
            this.documentFields[index].file = null;
            return;
        }
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
            this.documentFields[index].fileError = 'Invalid file type. Allowed: JPG, PNG, PDF, DOC';
            this.documentFields[index].file = null;
            return;
        }
        this.documentFields[index].file = file;
        this.documentFields[index].fileError = '';
    }

    uploadDocuments(employeeId: number): Promise<any> {
        if (this.documentFields.length === 0) return Promise.resolve();
        const formData = new FormData();
        const documentTypes: string[] = [];
        for (const doc of this.documentFields) {
            if (doc.file && doc.documentType) {
                formData.append('documents', doc.file);
                documentTypes.push(doc.documentType);
            }
        }
        if (formData.getAll('documents').length === 0) return Promise.resolve();
        documentTypes.forEach(type => formData.append('documentTypes', type));
        const token = localStorage.getItem('token');
        return fetch(`https://localhost:7141/api/employees/${employeeId}/documents`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        })
        .then(res => { if (!res.ok) return res.json().then(err => Promise.reject(err)); return res.json(); })
        .then(data => { if (data.documents) this.employeeDocuments = [...this.employeeDocuments, ...data.documents]; this.documentFields = []; return data; })
        .catch(err => { console.error('Error uploading documents:', err); return Promise.reject(err); });
    }

    removeDocument(docId: number, index: number) {
        if (!confirm('Delete this document?')) return;
        const token = localStorage.getItem('token');
        fetch(`https://localhost:7141/api/employees/documents/${docId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(() => { this.employeeDocuments.splice(index, 1); this.cdr.detectChanges(); })
        .catch(err => console.error(err));
    }

    viewEmployeeDocuments(employeeId: number, employeeName: string) {
        this.router.navigate(['/admin/documents', employeeId], { queryParams: { name: employeeName } });
    }

    // ==================== EMPLOYEE CRUD ====================
    deactivateEmployee(id: number) {
        if (!confirm('Deactivate this employee?')) return;
        const token = localStorage.getItem('token');
        fetch(`https://localhost:7141/api/employees/${id}/deactivate`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => { alert(data.message); this.loadEmployeesList(); })
        .catch(err => alert('Failed to deactivate employee'));
    }

    restoreEmployee(id: number) {
        if (!confirm('Restore this employee?')) return;
        const token = localStorage.getItem('token');
        fetch(`https://localhost:7141/api/employees/${id}/restore`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => { alert(data.message); this.loadEmployeesList(); })
        .catch(err => alert('Failed to restore employee'));
    }

    openEditEmployeeModal(emp: any) {
        this.editEmployeeData = {
            id: emp.id, name: emp.name, email: emp.email, phone: emp.phone || '', address: emp.address || '',
            designation: emp.designation, salary: emp.salary, departmentId: emp.departmentId,
            joiningDate: new Date(emp.joiningDate).toISOString().split('T')[0], photo: emp.photo || '',
            gender: emp.gender || '', dateOfBirth: emp.dateOfBirth ? new Date(emp.dateOfBirth).toISOString().split('T')[0] : '', education: emp.education || ''
        };
        this.editSelectedPhoto = null;
        this.editPhotoPreview = null;
        this.editEmployeeError = '';
        this.editEmployeeSuccess = '';
        this.editDocumentFields = [];
        this.showEditEmployeeModal = true;
        this.loadEmployeeDocumentsForEdit(emp.id);
        this.cdr.detectChanges();
    }

    loadEmployeeDocumentsForEdit(employeeId: number) {
        const token = localStorage.getItem('token');
        fetch(`https://localhost:7141/api/employees/${employeeId}/documents`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => { this.editEmployeeDocuments = Array.isArray(data) ? data : []; this.cdr.detectChanges(); })
        .catch(err => { this.editEmployeeDocuments = []; });
    }

    closeEditEmployeeModal() {
        this.showEditEmployeeModal = false;
        this.editEmployeeDocuments = [];
        this.editDocumentFields = [];
        this.cdr.detectChanges();
    }

    onEditPhotoSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { this.editEmployeeError = 'File size must be less than 5MB'; return; }
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.type)) { this.editEmployeeError = 'Invalid file type. Allowed: JPG, PNG'; return; }
            this.editSelectedPhoto = file;
            const reader = new FileReader();
            reader.onload = (e: any) => { this.editPhotoPreview = e.target.result; this.cdr.detectChanges(); };
            reader.readAsDataURL(file);
            this.editEmployeeError = '';
        }
    }

    addEditDocumentField() { this.editDocumentFields.push({ documentType: '', file: null, fileError: '' }); this.cdr.detectChanges(); }
    removeEditDocumentField(index: number) { this.editDocumentFields.splice(index, 1); this.cdr.detectChanges(); }
    
    onEditDocumentSelected(event: any, index: number) {
        const file = event.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { this.editDocumentFields[index].fileError = 'File size must be less than 5MB'; this.editDocumentFields[index].file = null; return; }
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) { this.editDocumentFields[index].fileError = 'Invalid file type'; this.editDocumentFields[index].file = null; return; }
        this.editDocumentFields[index].file = file;
        this.editDocumentFields[index].fileError = '';
    }

    removeEditDocument(docId: number, index: number) {
        if (!confirm('Delete this document?')) return;
        const token = localStorage.getItem('token');
        fetch(`https://localhost:7141/api/employees/documents/${docId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(() => { this.editEmployeeDocuments.splice(index, 1); this.cdr.detectChanges(); alert('Document deleted'); })
        .catch(err => alert('Failed to delete document'));
    }

    uploadEditDocuments(employeeId: number): Promise<any> {
        if (this.editDocumentFields.length === 0) return Promise.resolve();
        const formData = new FormData();
        const documentTypes: string[] = [];
        for (const doc of this.editDocumentFields) {
            if (doc.file && doc.documentType) {
                formData.append('documents', doc.file);
                documentTypes.push(doc.documentType);
            }
        }
        if (formData.getAll('documents').length === 0) return Promise.resolve();
        documentTypes.forEach(type => formData.append('documentTypes', type));
        const token = localStorage.getItem('token');
        return fetch(`https://localhost:7141/api/employees/${employeeId}/documents`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        })
        .then(res => { if (!res.ok) return res.json().then(err => Promise.reject(err)); return res.json(); })
        .then(data => { if (data.documents) this.editEmployeeDocuments = [...this.editEmployeeDocuments, ...data.documents]; this.editDocumentFields = []; return data; })
        .catch(err => { console.error('Error uploading documents:', err); return Promise.reject(err); });
    }

    updateEmployee() {
        if (!this.editEmployeeData.name || !this.editEmployeeData.email || !this.editEmployeeData.phone ||
            !this.editEmployeeData.address || !this.editEmployeeData.designation || !this.editEmployeeData.salary || !this.editEmployeeData.departmentId) {
            this.editEmployeeError = 'Please fill in all required fields';
            return;
        }
        this.editEmployeeSaving = true;
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('name', this.editEmployeeData.name);
        formData.append('email', this.editEmployeeData.email);
        formData.append('phone', this.editEmployeeData.phone);
        formData.append('address', this.editEmployeeData.address);
        formData.append('designation', this.editEmployeeData.designation);
        formData.append('salary', this.editEmployeeData.salary.toString());
        formData.append('departmentId', this.editEmployeeData.departmentId.toString());
        formData.append('joiningDate', this.editEmployeeData.joiningDate);
        formData.append('gender', this.editEmployeeData.gender);
        formData.append('dateOfBirth', this.editEmployeeData.dateOfBirth);
        formData.append('education', this.editEmployeeData.education);
        if (this.editSelectedPhoto) formData.append('photo', this.editSelectedPhoto);
        
        fetch(`https://localhost:7141/api/employees/${this.editEmployeeData.id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        })
        .then(async res => {
            const data = await res.json();
            if (res.ok) {
                if (this.editDocumentFields.length > 0) await this.uploadEditDocuments(this.editEmployeeData.id);
                this.editEmployeeSuccess = 'Employee updated successfully!';
                setTimeout(() => { this.closeEditEmployeeModal(); this.loadEmployeesList(); }, 1500);
            } else { this.editEmployeeError = data.message || 'Failed to update employee'; }
            this.editEmployeeSaving = false;
            this.cdr.detectChanges();
        })
        .catch(err => { this.editEmployeeError = 'Something went wrong'; this.editEmployeeSaving = false; this.cdr.detectChanges(); });
    }

    createEmployee() {
        if (!this.newEmployee.name || !this.newEmployee.email || !this.newEmployee.temporaryPassword) {
            this.empError = 'Please fill all required fields (Name, Email, Password)';
            return;
        }
        if (!this.newEmployee.gender) { this.empError = 'Please select gender'; return; }
        if (!this.newEmployee.dateOfBirth) { this.empError = 'Please enter date of birth'; return; }
        if (!this.newEmployee.education) { this.empError = 'Please select education'; return; }
        if (this.newEmployee.temporaryPassword.length < 8) { this.empError = 'Password must be at least 8 characters'; return; }
        if (!this.newEmployee.departmentId) { this.empError = 'Please select a department'; return; }
        if (!this.newEmployee.designation) { this.empError = 'Please select a designation'; return; }

        this.empSaving = true;
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('name', this.newEmployee.name);
        formData.append('email', this.newEmployee.email);
        formData.append('phone', this.newEmployee.phone || '');
        formData.append('address', this.newEmployee.address || '');
        formData.append('designation', this.newEmployee.designation);
        formData.append('salary', this.newEmployee.salary.toString());
        formData.append('departmentId', this.newEmployee.departmentId.toString());
        formData.append('joiningDate', this.newEmployee.joiningDate);
        formData.append('temporaryPassword', this.newEmployee.temporaryPassword);
        formData.append('gender', this.newEmployee.gender);
        formData.append('dateOfBirth', this.newEmployee.dateOfBirth);
        formData.append('education', this.newEmployee.education);
        formData.append('instituteName', this.newEmployee.instituteName);
        // ⚠️ PROBLEM: 'selectedImage' is not defined in AdminComponent
        // if (this.selectedImage) formData.append('photo', this.selectedImage);  // ← REMOVE THIS LINE

        fetch('https://localhost:7141/api/employees', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        })
        .then(async res => {
            const data = await res.json();
            if (res.ok) {
                if (this.documentFields.length > 0 && data.employee?.id) await this.uploadDocuments(data.employee.id);
                this.empSuccess = `Employee created! Temporary password: ${data.temporaryPassword}`;
                setTimeout(() => { this.resetNewEmployeeForm(); this.onMenuClick('employees'); this.loadEmployeesList(); }, 2000);
            } else { this.empError = data.message || 'Failed to create employee'; }
            this.empSaving = false;
            this.cdr.detectChanges();
        })
        .catch(err => { this.empError = 'Network error'; this.empSaving = false; this.cdr.detectChanges(); });
    }

    deleteEmployee(id: number) {
        if (!confirm('Delete this employee?')) return;
        const token = localStorage.getItem('token');
        fetch(`https://localhost:7141/api/employees/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => { alert(data.message); this.loadEmployeesList(); })
        .catch(err => console.error(err));
    }

    // ==================== USER MANAGEMENT ====================
    loadUsers() {
        const token = localStorage.getItem('token');
        this.loading = true;
        const params = new URLSearchParams({ page: this.currentPage.toString(), pageSize: this.pageSize.toString(), search: this.searchText, status: this.currentStatus });
        fetch(`https://localhost:7141/api/admin/users?${params}`, {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => { this.users = data.users; this.totalUsers = data.totalUsers; this.totalPages = data.totalPages; this.loading = false; this.cdr.detectChanges(); })
        .catch(err => { this.errorMessage = 'Failed to load users.'; this.loading = false; this.cdr.detectChanges(); });
    }

    onSearch() { clearTimeout(this.searchTimeout); this.searchTimeout = setTimeout(() => { this.currentPage = 1; this.loadUsers(); }, 500); }
    filterByStatus(status: string) { this.currentStatus = status; this.currentPage = 1; this.loadUsers(); }
    changePage(page: number) { if (page < 1 || page > this.totalPages) return; this.currentPage = page; this.loadUsers(); }
    getPages(): number[] { const pages = []; for (let i = 1; i <= this.totalPages; i++) pages.push(i); return pages; }
    
    deactivateUser(id: string) { /* similar implementation */ }
    restoreUser(id: string) { /* similar implementation */ }
    deleteUser(id: string) { /* similar implementation */ }

    loadEmployees() {
        const token = localStorage.getItem('token');
        fetch('https://localhost:7141/api/employees?pageSize=100', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => { if (data.employees) this.employees = data.employees; this.cdr.detectChanges(); })
        .catch(err => console.error(err));
    }

    // ==================== TASK MANAGEMENT ====================
    loadAdminTasks() {
        const token = localStorage.getItem('token');
        fetch('https://localhost:7141/api/admin/tasks/all', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => { this.adminTasks = data; this.cdr.detectChanges(); })
        .catch(err => console.error(err));
    }

    openAssignTaskModal() { this.showTaskModal = true; this.cdr.detectChanges(); }
    
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
        .then(res => res.json())
        .then(data => { alert(data.message); this.assigning = false; this.showTaskModal = false; this.loadAdminTasks(); this.cdr.detectChanges(); })
        .catch(err => { this.taskError = 'Failed to assign task'; this.assigning = false; this.cdr.detectChanges(); });
    }

    deleteTask(taskId: number) {
        if (!confirm('Delete this task?')) return;
        const token = localStorage.getItem('token');
        fetch(`https://localhost:7141/api/admin/tasks/${taskId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => { alert(data.message); this.loadAdminTasks(); })
        .catch(err => console.error(err));
    }

    // ==================== LEAVE MANAGEMENT ====================
    loadPendingLeaves() {
        const token = localStorage.getItem('token');
        fetch('https://localhost:7141/api/admin/leaves/pending', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => { this.leaveRequests = data; this.pendingLeavesCount = data.length; this.cdr.detectChanges(); })
        .catch(err => console.error(err));
    }

    approveLeave(leaveId: number) {
        const remarks = prompt('Enter any remarks (optional):');
        const token = localStorage.getItem('token');
        fetch(`https://localhost:7141/api/admin/leaves/${leaveId}/approve`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminRemarks: remarks || '' })
        })
        .then(res => res.json())
        .then(data => { alert(data.message); this.loadPendingLeaves(); this.loadLeaveHistory(); })
        .catch(err => console.error(err));
    }

    rejectLeave(leaveId: number) {
        const remarks = prompt('Enter rejection reason:');
        if (!remarks) return;
        const token = localStorage.getItem('token');
        fetch(`https://localhost:7141/api/admin/leaves/${leaveId}/reject`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminRemarks: remarks })
        })
        .then(res => res.json())
        .then(data => { alert(data.message); this.loadPendingLeaves(); this.loadLeaveHistory(); })
        .catch(err => console.error(err));
    }

    loadLeaveHistory() {
        const token = localStorage.getItem('token');
        let url = 'https://localhost:7141/api/admin/leaves/all';
        const params: string[] = [];
        if (this.historyFilterStatus) params.push(`status=${this.historyFilterStatus}`);
        if (params.length > 0) url += '?' + params.join('&');
        fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => { this.leaveHistory = Array.isArray(data) ? data : []; this.cdr.detectChanges(); })
        .catch(err => { this.leaveHistory = []; this.cdr.detectChanges(); });
    }

    // ==================== ATTENDANCE ====================
    loadAllAttendance() {
        const token = localStorage.getItem('token');
        const url = this.attendanceDate ? `https://localhost:7141/api/admin/attendance/all?date=${this.attendanceDate}` : 'https://localhost:7141/api/admin/attendance/all';
        fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => { this.allAttendances = data; this.cdr.detectChanges(); })
        .catch(err => console.error(err));
    }

    // ==================== MENU ====================
    onMenuClick(menuItem: string) {
        switch(menuItem) {
            case 'employees': this.router.navigate(['/admin/employeelist']); break;
            case 'createemployee': this.router.navigate(['/admin/createemployee']); break;
            case 'tasks': this.router.navigate(['/admin/tasks']); break;
            case 'leaverequests': this.router.navigate(['/admin/leaverequests']); break;
            case 'leavehistory': this.router.navigate(['/admin/leavehistory']); break;
            case 'attendance': this.router.navigate(['/admin/attendance']); break;
        }
    }

    toggleSection(section: string) 
    { 
        this.expandedSections[section] = !this.expandedSections[section]; 
        this.cdr.detectChanges(); 
    }
    formatDate(dateString: string): string 
    { 
        if (!dateString) return 'N/A'; 
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); 
    }
    formatFileSize(bytes: number): string 
    { 
        if (!bytes) return '0 B'; 
        const sizes = ['B', 'KB', 'MB', 'GB']; 
        const i = Math.floor(Math.log(bytes) / Math.log(1024)); 
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i]; 
    }
}