import { Component, OnInit, PLATFORM_ID, Inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router'; // Add ActivatedRoute
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
        name: '', 
        email: '', 
        phone: '', 
        address: '', 
        designation: '', 
        salary: 0,
        departmentId: '',
        joiningDate: new Date().toISOString().split('T')[0], 
        temporaryPassword:"",
        gender: '',   
        dateOfBirth: '',   
        education:  '',
        instituteName: ''
    };

    // Edit Employee Properties
showEditEmployeeModal: boolean = false;
editEmployeeData: any = {
    id: 0,
    name: '',
    email: '',
    phone: '',
    address: '',
    designation: '',
    salary: 0,
    departmentId: '',
    joiningDate: '',
    photo: '',
    gender: '',       
    dateOfBirth: '',   
    education: ''  
};
editSelectedPhoto: File | null = null;
editPhotoPreview: string | null = null;
editEmployeeSaving: boolean = false;
editEmployeeError: string = '';
editEmployeeSuccess: string = '';

    // Employee List Pagination & Filter Properties
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

    // Profile
    email: string = '';
    fullName: string = '';
    profileImage: string | null = null;
    apiUrl: string = 'https://localhost:7141';

    // Menu & Sidebar
    showMenu: boolean = false;
    showSidebar: boolean = false;
    activeMenu: string = '';

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
    private lastActiveSection: string = 'management';
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

    // Edit Employee Document Properties
editEmployeeDocuments: any[] = [];
editDocumentFields: any[] = [];
editUploadingDocuments: boolean = false;

    // Collapsible Sidebar Sections
    expandedSections: any = {
        management: false,
        tasks: false,
        leaves: false,
        attendance: false
    };

    Math = Math;
    private searchTimeout: any;

formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

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

    // Load all data
    this.loadUsers();
    this.loadEmployees();
    this.loadDepartments();
    this.loadAdminTasks();
    this.loadAllAttendance();
    this.loadPendingLeaves();
    this.loadLeaveHistory();

    
    // Get current URL after a short delay to ensure data is loaded
    setTimeout(() => {
        this.handleRoute();
    }, 100);
}

@HostListener('document:click', ['$event'])
onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // Close menu only if click is outside the profile-wrapper
    if (!target.closest('.profile-wrapper') && !target.closest('.profile-menu')) {
        if (this.showMenu) {
            this.showMenu = false;
            this.cdr.detectChanges();
        }
    }
}

// Load employee documents when editing
loadEmployeeDocumentsForEdit(employeeId: number) {
    const token = localStorage.getItem('token');
    
    fetch(`https://localhost:7141/api/employees/${employeeId}/documents`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        this.editEmployeeDocuments = Array.isArray(data) ? data : [];
        this.cdr.detectChanges();
    })
    .catch(error => {
        console.error('Error loading documents:', error);
        this.editEmployeeDocuments = [];
    });
}

formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

// Add document field for edit modal
addEditDocumentField() {
    this.editDocumentFields.push({ documentType: '', file: null, fileError: '' });
    this.cdr.detectChanges();
}

// Remove document field from edit modal
removeEditDocumentField(index: number) {
    this.editDocumentFields.splice(index, 1);
    this.cdr.detectChanges();
}

// Handle document selection in edit modal
onEditDocumentSelected(event: any, index: number) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        this.editDocumentFields[index].fileError = 'File size must be less than 5MB';
        this.editDocumentFields[index].file = null;
        return;
    }

    const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedTypes.includes(file.type)) {
        this.editDocumentFields[index].fileError = 'Invalid file type. Allowed: JPG, PNG, PDF, DOC';
        this.editDocumentFields[index].file = null;
        return;
    }

    this.editDocumentFields[index].file = file;
    this.editDocumentFields[index].fileError = '';
}

// Remove existing document from edit modal
removeEditDocument(docId: number, index: number) {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    const token = localStorage.getItem('token');
    
    fetch(`https://localhost:7141/api/employees/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(() => {
        this.editEmployeeDocuments.splice(index, 1);
        this.cdr.detectChanges();
        alert('Document deleted successfully');
    })
    .catch(error => {
        console.error('Error deleting document:', error);
        alert('Failed to delete document');
    });
}

// Upload documents for edit
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
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
        }
        return response.json();
    })
    .then(data => {
        if (data.documents) {
            this.editEmployeeDocuments = [...this.editEmployeeDocuments, ...data.documents];
        }
        this.editDocumentFields = [];
        return data;
    })
    .catch(error => {
        console.error('Error uploading documents:', error);
        return Promise.reject(error);
    });
}

// Add this new method to handle routing
handleRoute() {
    const currentUrl = this.router.url;
    console.log('Current URL:', currentUrl);
    
    if (currentUrl.includes('/admin/employeelist')) {
        this.showHomePage = false;
        this.activeContent = 'employees';
        this.activeMenu = 'employees';
        this.resetEmployeeFilters();
        this.expandedSections['management'] = true;
        this.lastActiveSection = 'management';
    } 
    else if (currentUrl.includes('/admin/createemployee')) {
        this.showHomePage = false;
        this.activeContent = 'createemployee';
        this.activeMenu = 'createemployee';
        this.resetNewEmployeeForm();
        this.expandedSections['management'] = true;
        this.lastActiveSection = 'management';
    }
    else if (currentUrl.includes('/admin/tasks')) {
        this.showHomePage = false;
        this.activeContent = 'tasks';
        this.activeMenu = 'tasks';
        this.loadAdminTasks();
        this.expandedSections['tasks'] = true;
        this.lastActiveSection = 'tasks';
    }
    else if (currentUrl.includes('/admin/leaverequests')) {
        this.showHomePage = false;
        this.activeContent = 'leaverequests';
        this.activeMenu = 'leaverequests';
        this.loadPendingLeaves();
        this.expandedSections['leaves'] = true;
        this.lastActiveSection = 'leaves';
    }
    else if (currentUrl.includes('/admin/leavehistory')) {
        this.showHomePage = false;
        this.activeContent = 'leavehistory';
        this.activeMenu = 'leavehistory';
        this.loadLeaveHistory();
        this.expandedSections['leaves'] = true;
        this.lastActiveSection = 'leaves';
    }
    else if (currentUrl.includes('/admin/attendance')) {
        this.showHomePage = false;
        this.activeContent = 'attendance';
        this.activeMenu = 'attendance';
        this.loadAllAttendance();
        this.expandedSections['attendance'] = true;
        this.lastActiveSection = 'attendance';
    }
    else {
        // Check for return flag from documents page
        const returnToEmployees = localStorage.getItem('returnToEmployees');
        if (returnToEmployees === 'true') {
            localStorage.removeItem('returnToEmployees');
            this.showHomePage = false;
            this.activeContent = 'employees';
            this.activeMenu = 'employees';
            this.resetEmployeeFilters();
            this.expandedSections['management'] = true;
            this.lastActiveSection = 'management';
            // Update URL to match
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
    getActiveUsersCount(): number {
        return this.users.filter(u => u.isActive).length;
    }

    getActiveEmployeesCount(): number {
        return this.employeeList.filter(e => e.isActive).length;
    }

    goToHome() {
    localStorage.removeItem('returnToEmployees');
    this.router.navigate(['/admin']);
}

    onMenuClick(menuItem: string) {
    console.log('Menu clicked:', menuItem);
    this.showSidebar = false;
    
    // Keep the parent section expanded based on the menu item
    switch(menuItem) {
        case 'employees':
            this.expandedSections['management'] = true;
            this.lastActiveSection = 'management';
            this.router.navigate(['/admin/employeelist']);
            break;
        case 'createemployee':
            this.expandedSections['management'] = true;
            this.lastActiveSection = 'management';
            this.router.navigate(['/admin/createemployee']);  // FIXED: was going to employeelist
            break;
        case 'tasks':
            this.expandedSections['tasks'] = true;
            this.lastActiveSection = 'tasks';
            this.router.navigate(['/admin/tasks']);
            break;
        case 'leaverequests':
            this.expandedSections['leaves'] = true;
            this.lastActiveSection = 'leaves';
            this.router.navigate(['/admin/leaverequests']);
            break;
        case 'leavehistory':
            this.expandedSections['leaves'] = true;
            this.lastActiveSection = 'leaves';
            this.router.navigate(['/admin/leavehistory']);
            break;
        case 'attendance':
            this.expandedSections['attendance'] = true;
            this.lastActiveSection = 'attendance';
            this.router.navigate(['/admin/attendance']);
            break;
    }
}
    toggleSection(section: string) {
        this.expandedSections[section] = !this.expandedSections[section];
        this.cdr.detectChanges();
    }

    // ==================== EMPLOYEE LIST METHODS ====================
    // ==================== EMPLOYEE LIST WITH PAGINATION ====================
loadEmployeesList() {
    const token = localStorage.getItem('token');
    this.empLoading = true;
    this.cdr.detectChanges();
    
    // Build query parameters
    const params = new URLSearchParams();
    params.append('page', this.employeeCurrentPage.toString());
    params.append('pageSize', this.employeePageSize.toString());
    params.append('search', this.employeeSearchText);
    params.append('status', this.employeeStatusFilter);
    
    if (this.employeeDepartmentFilter) {
        params.append('departmentId', this.employeeDepartmentFilter);
    }
    
    const url = `https://localhost:7141/api/employees?${params.toString()}`;
    
    fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        this.employeeList = data.employees || [];
        this.employeeTotalEmployees = data.totalEmployees || 0;
        this.employeeTotalPages = data.totalPages || 0;
        this.empLoading = false;
        this.cdr.detectChanges();
    })
    .catch(error => {
        console.error('Error loading employees:', error);
        this.employeeList = [];
        this.empLoading = false;
        this.cdr.detectChanges();
    });
}

// Search with debounce
onEmployeeSearch() {
    clearTimeout(this.employeeSearchTimeout);
    this.employeeSearchTimeout = setTimeout(() => {
        this.employeeCurrentPage = 1;
        this.loadEmployeesList();
    }, 500);
}

// Filter by department
filterEmployeeByDepartment() {
    this.employeeCurrentPage = 1;
    this.loadEmployeesList();
}

// Filter by status (active/inactive/all)
filterEmployeeByStatus(status: string) {
    this.employeeStatusFilter = status;
    this.employeeCurrentPage = 1;
    this.loadEmployeesList();
}

// Reset all filters
resetEmployeeFilters() {
    this.employeeSearchText = '';
    this.employeeDepartmentFilter = '';
    this.employeeStatusFilter = 'active';
    this.employeeCurrentPage = 1;
    this.loadEmployeesList();
}

// Change page
changeEmployeePage(page: number) {
    if (page < 1 || page > this.employeeTotalPages) return;
    this.employeeCurrentPage = page;
    this.loadEmployeesList();
}

// Get page numbers for pagination
getEmployeePages(): number[] {
    const pages = [];
    const maxPages = 5;
    let startPage = Math.max(1, this.employeeCurrentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.employeeTotalPages, startPage + maxPages - 1);
    
    if (endPage - startPage + 1 < maxPages) {
        startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }
    return pages;
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
            name: '', 
            email: '', 
            phone: '', 
            address: '', 
            designation: '', 
            salary: 0,
            departmentId: '', 
            joiningDate: new Date().toISOString().split('T')[0], 
            temporaryPassword: '', 
            gender: '',      
            dateOfBirth: '',   
            education: '' ,
            instituteName: '' 
             };

        this.empError = '';
        this.empSuccess = '';
        this.employeeDocuments = [];
        this.documentFields = [];
        this.selectedImage = null;
        this.imagePreview = null;
    }

    // ==================== DOCUMENT METHODS ====================
    addDocumentField() {
        this.documentFields.push({ documentType: '', file: null, fileError: '' });
        this.cdr.detectChanges();
    }

    removeDocumentField(index: number) {
        this.documentFields.splice(index, 1);
        this.cdr.detectChanges();
    }

    onDocumentSelected(event: any, index: number) {
        const file = event.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            this.documentFields[index].fileError = 'File size must be less than 5MB';
            this.documentFields[index].file = null;
            return;
        }

        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png',
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
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
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => Promise.reject(err));
            }
            return response.json();
        })
        .then(data => {
            if (data.documents) {
                this.employeeDocuments = [...this.employeeDocuments, ...data.documents];
            }
            this.documentFields = [];
            return data;
        })
        .catch(error => {
            console.error('Error uploading documents:', error);
            return Promise.reject(error);
        });
    }

    removeDocument(docId: number, index: number) {
        if (!confirm('Are you sure you want to delete this document?')) return;
        const token = localStorage.getItem('token');

        fetch(`https://localhost:7141/api/employees/documents/${docId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(() => {
            this.employeeDocuments.splice(index, 1);
            this.cdr.detectChanges();
        })
        .catch(error => console.error('Error deleting document:', error));
    }

   viewEmployeeDocuments(employeeId: number, employeeName: string) {
    console.log('Navigating to documents for:', employeeId, employeeName);
    this.router.navigate(['/admin/documents', employeeId], {
        queryParams: { name: employeeName }
    });
}
    closeDocumentsModal() {
        this.showDocumentsModal = false;
        this.employeeDocuments = [];
        this.cdr.detectChanges();
    }

    deleteDocument(docId: number, index: number) {
        if (!confirm('Delete this document?')) return;
        const token = localStorage.getItem('token');

        fetch(`https://localhost:7141/api/employees/documents/${docId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(() => {
            this.employeeDocuments.splice(index, 1);
            this.cdr.detectChanges();
        })
        .catch(error => console.error('Error deleting document:', error));
    }

    // ==================== EMPLOYEE ACTIONS ====================

// Deactivate Employee
deactivateEmployee(id: number) {
    if (!confirm('Are you sure you want to deactivate this employee? They will not be able to login.')) return;
    
    const token = localStorage.getItem('token');
    
    fetch(`https://localhost:7141/api/employees/${id}/deactivate`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message || 'Employee deactivated successfully');
        this.loadEmployeesList(); // Refresh the list
        this.cdr.detectChanges();
    })
    .catch(error => {
        console.error('Error deactivating employee:', error);
        alert('Failed to deactivate employee');
    });
}

// Restore Employee
restoreEmployee(id: number) {
    if (!confirm('Are you sure you want to restore this employee? They will be able to login again.')) return;
    
    const token = localStorage.getItem('token');
    
    fetch(`https://localhost:7141/api/employees/${id}/restore`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message || 'Employee restored successfully');
        this.loadEmployeesList(); // Refresh the list
        this.cdr.detectChanges();
    })
    .catch(error => {
        console.error('Error restoring employee:', error);
        alert('Failed to restore employee');
    });
}

// ==================== EDIT EMPLOYEE METHODS ====================

// Open Edit Employee Modal
openEditEmployeeModal(emp: any) {
    this.editEmployeeData = {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        phone: emp.phone || '',
        address: emp.address || '',
        designation: emp.designation,
        salary: emp.salary,
        departmentId: emp.departmentId,
        joiningDate: new Date(emp.joiningDate).toISOString().split('T')[0],
        photo: emp.photo || '',
        gender: emp.gender || '',        // NEW
        dateOfBirth: emp.dateOfBirth ? new Date(emp.dateOfBirth).toISOString().split('T')[0] : '',   // NEW
        education: emp.education || ''   // NEW
    };
    this.editSelectedPhoto = null;
    this.editPhotoPreview = null;
    this.editEmployeeError = '';
    this.editEmployeeSuccess = '';
    this.editDocumentFields = [];
    this.showEditEmployeeModal = true;
    
    // Load existing documents
    this.loadEmployeeDocumentsForEdit(emp.id);
    
    this.cdr.detectChanges();
}

// Close Edit Employee Modal
closeEditEmployeeModal() {
    this.showEditEmployeeModal = false;
    this.editEmployeeData = {
        id: 0,
        name: '',
        email: '',
        phone: '',
        address: '',
        designation: '',
        salary: 0,
        departmentId: '',
        joiningDate: '',
        photo: ''
    };
    this.editSelectedPhoto = null;
    this.editPhotoPreview = null;
    this.editEmployeeError = '';
    this.editEmployeeSuccess = '';
    this.editEmployeeDocuments = [];
    this.editDocumentFields = [];
    this.cdr.detectChanges();
}
// On Photo Selected for Edit
onEditPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            this.editEmployeeError = 'File size must be less than 5MB';
            return;
        }
        
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            this.editEmployeeError = 'Invalid file type. Allowed: JPG, PNG';
            return;
        }
        
        this.editSelectedPhoto = file;
        const reader = new FileReader();
        reader.onload = (e: any) => {
            this.editPhotoPreview = e.target.result;
            this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);
        this.editEmployeeError = '';
    }
}

// Update Employee
updateEmployee() {
    if (!this.editEmployeeData.name || !this.editEmployeeData.email ||
        !this.editEmployeeData.phone || !this.editEmployeeData.address ||
        !this.editEmployeeData.designation || !this.editEmployeeData.salary ||
        !this.editEmployeeData.departmentId) {
        this.editEmployeeError = 'Please fill in all required fields';
        this.cdr.detectChanges();
        return;
    }
    
    this.editEmployeeSaving = true;
    this.editEmployeeError = '';
    this.editEmployeeSuccess = '';
    
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
    
    if (this.editSelectedPhoto) {
        formData.append('photo', this.editSelectedPhoto);
    }
    
    fetch(`https://localhost:7141/api/employees/${this.editEmployeeData.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    })
    .then(async response => {
        const data = await response.json();
        if (response.ok) {
            // Upload documents after employee update
            if (this.editDocumentFields.length > 0) {
                try {
                    await this.uploadEditDocuments(this.editEmployeeData.id);
                } catch (docError) {
                    console.error('Document upload failed:', docError);
                }
            }
            
            this.editEmployeeSuccess = 'Employee updated successfully!';
            setTimeout(() => {
                this.closeEditEmployeeModal();
                this.loadEmployeesList(); // Refresh the list
            }, 1500);
        } else {
            this.editEmployeeError = data.message || 'Failed to update employee';
        }
        this.editEmployeeSaving = false;
        this.cdr.detectChanges();
    })
    .catch(error => {
        console.error('Error updating employee:', error);
        this.editEmployeeError = 'Something went wrong';
        this.editEmployeeSaving = false;
        this.cdr.detectChanges();
    });
}
    // ==================== CREATE EMPLOYEE ====================
    createEmployee() {
        // --- VALIDATION ---
        if (!this.newEmployee.name || !this.newEmployee.email || !this.newEmployee.temporaryPassword) {
            this.empError = 'Please fill all required fields (Name, Email, Password)';
            return;
        }
        if (!this.newEmployee.gender) {
        this.empError = 'Please select gender';
        return;
    }
    if (!this.newEmployee.dateOfBirth) {
        this.empError = 'Please enter date of birth';
        return;
    }

    if (!this.newEmployee.education) {
        this.empError = 'Please select education';
        return;
    }

        // FIX: match backend Identity RequiredLength = 8
        if (this.newEmployee.temporaryPassword.length < 8) {
            this.empError = 'Password must be at least 8 characters';
            return;
        }

        if (!this.newEmployee.departmentId) {
            this.empError = 'Please select a department';
            return;
        }

        if (!this.newEmployee.designation) {
            this.empError = 'Please select a designation';
            return;
        }

        this.empSaving = true;
        this.empError = '';
        this.empSuccess = '';
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

        // Append photo only if selected
        if (this.selectedImage) {
            formData.append('photo', this.selectedImage);
        }

        fetch('https://localhost:7141/api/employees', {
            method: 'POST',
            // DO NOT set Content-Type manually — browser sets it with boundary automatically
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        })
        .then(async response => {
            const data = await response.json();

            if (response.ok) {
                // Upload documents after employee is created
                if (this.documentFields.length > 0 && data.employee?.id) {
                    try {
                        await this.uploadDocuments(data.employee.id);
                    } catch (docError) {
                        console.error('Document upload failed (employee was created):', docError);
                        // Don't block success — employee was created, just documents failed
                    }
                }

                this.empSuccess = `Employee created! Temporary password: ${data.temporaryPassword}`;
                this.empSaving = false;
                this.cdr.detectChanges();

                setTimeout(() => {
                    this.resetNewEmployeeForm();
                    this.onMenuClick('employees');
                    this.loadEmployeesList();
                }, 2000);
            } else {
                this.empError = data.message || 'Failed to create employee';
                this.empSaving = false;
                this.cdr.detectChanges();
            }
        })
        .catch(error => {
            console.error('Error creating employee:', error);
            this.empError = 'Network error — please try again';
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
        .catch(error => console.error('Error deleting employee:', error));
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
        for (let i = 1; i <= this.totalPages; i++) pages.push(i);
        return pages;
    }

    deactivateUser(id: string) {
        if (!confirm('Deactivate this user?')) return;
        const token = localStorage.getItem('token');

        fetch(`https://localhost:7141/api/admin/users/${id}/deactivate`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(() => {
            this.successMessage = 'User deactivated successfully!';
            this.errorMessage = '';
            this.loadUsers();
            this.cdr.detectChanges();
        })
        .catch(() => { this.errorMessage = 'Failed to deactivate user.'; this.cdr.detectChanges(); });
    }

    restoreUser(id: string) {
        if (!confirm('Restore this user?')) return;
        const token = localStorage.getItem('token');

        fetch(`https://localhost:7141/api/admin/users/${id}/restore`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(() => {
            this.successMessage = 'User restored successfully!';
            this.errorMessage = '';
            this.loadUsers();
            this.cdr.detectChanges();
        })
        .catch(() => { this.errorMessage = 'Failed to restore user.'; this.cdr.detectChanges(); });
    }

    deleteUser(id: string) {
        if (!confirm('Permanently delete this user? This cannot be undone!')) return;
        const token = localStorage.getItem('token');

        fetch(`https://localhost:7141/api/admin/users/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(() => {
            this.successMessage = 'User permanently deleted!';
            this.errorMessage = '';
            this.loadUsers();
            this.cdr.detectChanges();
        })
        .catch(() => { this.errorMessage = 'Failed to delete user.'; this.cdr.detectChanges(); });
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
            if (data.employees) this.employees = data.employees;
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
        .then(data => { this.adminTasks = data; this.cdr.detectChanges(); })
        .catch(error => console.error('Error loading tasks:', error));
    }

    openAssignTaskModal() {
        this.newTask = { employeeId: '', title: '', description: '', priority: 'Medium', dueDate: '' };
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
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
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
        .then(data => { alert(data.message); this.loadAdminTasks(); this.cdr.detectChanges(); })
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
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminRemarks: remarks || '' })
        })
        .then(response => response.json())
        .then(data => { alert(data.message); this.loadPendingLeaves(); this.loadLeaveHistory(); this.cdr.detectChanges(); })
        .catch(error => console.error('Error approving leave:', error));
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
        .then(response => response.json())
        .then(data => { alert(data.message); this.loadPendingLeaves(); this.loadLeaveHistory(); this.cdr.detectChanges(); })
        .catch(error => console.error('Error rejecting leave:', error));
    }

    // ==================== LEAVE HISTORY ====================
    loadLeaveHistory() {
        const token = localStorage.getItem('token');
        let url = 'https://localhost:7141/api/admin/leaves/all';
        const params: string[] = [];

        if (this.historyFilterStatus) params.push(`status=${this.historyFilterStatus}`);
        if (this.historyStartDate) params.push(`startDate=${this.historyStartDate}`);
        if (this.historyEndDate) params.push(`endDate=${this.historyEndDate}`);
        if (params.length > 0) url += '?' + params.join('&');

        fetch(url, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
        .then(response => response.json())
        .then(data => { this.leaveHistory = Array.isArray(data) ? data : []; this.cdr.detectChanges(); })
        .catch(error => { console.error('Error loading leave history:', error); this.leaveHistory = []; this.cdr.detectChanges(); });
    }

    resetHistoryFilters() {
        this.historyFilterStatus = '';
        this.historyStartDate = '';
        this.historyEndDate = '';
        this.loadLeaveHistory();
    }

    // ==================== ATTENDANCE ====================
    loadAllAttendance() {
        const token = localStorage.getItem('token');
        const url = this.attendanceDate
            ? `https://localhost:7141/api/admin/attendance/all?date=${this.attendanceDate}`
            : 'https://localhost:7141/api/admin/attendance/all';

        fetch(url, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
        .then(response => response.json())
        .then(data => { this.allAttendances = data; this.cdr.detectChanges(); })
        .catch(error => console.error('Error loading attendance:', error));
    }

    // ==================== PROFILE & MENU ====================
    toggleMenu() { 
    console.log('toggleMenu called, current showMenu:', this.showMenu);
    this.showMenu = !this.showMenu; 
    console.log('toggleMenu called, new showMenu:', this.showMenu);
    this.cdr.detectChanges(); 
}
    toggleSidebar() { this.showSidebar = !this.showSidebar; this.cdr.detectChanges(); }
    goToDashboard() { this.router.navigate(['/admin']); }
    goToEmployees() { this.router.navigate(['/employee']); }

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
            reader.onload = (e: any) => { this.imagePreview = e.target.result; this.cdr.detectChanges(); };
            reader.readAsDataURL(file);
        }
    }

    updateProfile() {
        if (!this.editFullName) {
            this.editErrorMessage = 'Full name is required';
            this.cdr.detectChanges();
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
                this.cdr.detectChanges();
                setTimeout(() => this.closeModals(), 2000);
            } else {
                this.editErrorMessage = 'Failed to update profile.';
                this.cdr.detectChanges();
            }
        })
        .catch(() => { this.updating = false; this.editErrorMessage = 'Something went wrong.'; this.cdr.detectChanges(); });
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
        .then(async response => ({ status: response.status, data: await response.json() }))
        .then(result => {
            this.updating = false;
            if (result.status === 200) {
                this.editSuccessMessage = 'Password changed! Logging out...';
                this.cdr.detectChanges();
                setTimeout(() => this.logout(), 2000);
            } else {
                this.editErrorMessage = 'Failed to change password.';
                this.cdr.detectChanges();
            }
        })
        .catch(() => { this.updating = false; this.editErrorMessage = 'Something went wrong.'; this.cdr.detectChanges(); });
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