import { Component, OnInit, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-employee',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe, CurrencyPipe],
    templateUrl: './employee.html',
    styleUrl: './employee.css'
})
export class EmployeeComponent implements OnInit {
    // employees
    employees: any[] = [];
    departments: any[] = [];
    designations: string[] = [];
    totalEmployees: number = 0;
    totalPages: number = 0;
    currentPage: number = 1;
    pageSize: number = 10;
    searchText: string = '';
    currentStatus: string = 'active';
    selectedDepartmentId: any = '';
    loading: boolean = true;

    // profile
    email: string = '';
    fullName: string = '';
    profileImage: string | null = null;
    apiUrl: string = 'https://localhost:7141';

    // menu
    showMenu: boolean = false;

    // sidebar
    showSidebar: boolean = false;

    // modals
    showFormModal: boolean = false;
    showViewModal: boolean = false;
    isEditing: boolean = false;
    selectedEmployee: any = null;
    saving: boolean = false;

    // form
    form: any = this.emptyForm();
    selectedPhoto: File | null = null;
    photoPreview: string | null = null;

    // messages
    errorMessage: string = '';
    successMessage: string = '';
    formError: string = '';

    Math = Math;
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

        this.loadDepartments();
        this.loadDesignations();
        this.loadEmployees();
    }

    emptyForm() {
        return {
            id: 0,
            name: '',
            email: '',
            phone: '',
            address: '',
            designation: '',
            salary: 0,
            departmentId: '',
            joiningDate: new Date().toISOString().split('T')[0]
        };
    }

    loadDepartments() {
        const token = localStorage.getItem('token');
        
        console.log('Loading departments...');
        
        fetch('https://localhost:7141/api/employees/departments', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            console.log('Departments response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Departments data:', data);
            // Check if data is an array
            if (Array.isArray(data)) {
                this.departments = data;
            } else if (data && data.$values) {
                // Handle possible ASP.NET Core serialization format
                this.departments = data.$values;
            } else {
                // If no departments from API, use default
                this.departments = [];
            }
            
            if (this.departments.length === 0) {
                // Default departments if none from API
                this.departments = [
                    { id: 1, name: 'IT' },
                    { id: 2, name: 'HR' },
                    { id: 3, name: 'Finance' },
                    { id: 4, name: 'Marketing' },
                    { id: 5, name: 'Sales' },
                    { id: 6, name: 'Operations' }
                ];
            }
            
            this.cdr.detectChanges();
        })
        .catch(error => {
            console.error('Error loading departments:', error);
            // Default departments if API fails
            this.departments = [
                { id: 1, name: 'IT' },
                { id: 2, name: 'HR' },
                { id: 3, name: 'Finance' },
                { id: 4, name: 'Marketing' },
                { id: 5, name: 'Sales' },
                { id: 6, name: 'Operations' }
            ];
            this.cdr.detectChanges();
        });
    }

    loadDesignations() {
        const token = localStorage.getItem('token');
        
        console.log('Loading designations...');
        
        fetch('https://localhost:7141/api/employees/designations', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            console.log('Designations response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Designations data:', data);
            // Check if data is an array
            if (Array.isArray(data)) {
                this.designations = data;
            } else if (data && data.$values) {
                // Handle possible ASP.NET Core serialization format
                this.designations = data.$values;
            } else {
                this.designations = [];
            }
            
            if (this.designations.length === 0) {
                // Default designations if none from API
                this.designations = [
                    'Software Engineer',
                    'Senior Software Engineer',
                    'Team Lead',
                    'Project Manager',
                    'HR Manager',
                    'Accountant',
                    'Marketing Executive',
                    'Sales Executive',
                    'UI/UX Designer',
                    'QA Engineer',
                    'DevOps Engineer',
                    'System Administrator',
                    'Business Analyst',
                    'Product Manager',
                    'CTO',
                    'CEO',
                    'Intern',
                    'Junior Developer',
                    'Senior Developer',
                    'Technical Lead',
                    'Architect'
                ];
            }
            
            this.cdr.detectChanges();
        })
        .catch(error => {
            console.error('Error loading designations:', error);
            // Default designations if API fails
            this.designations = [
                'Software Engineer',
                'Senior Software Engineer',
                'Team Lead',
                'Project Manager',
                'HR Manager',
                'Accountant',
                'Marketing Executive',
                'Sales Executive',
                'UI/UX Designer',
                'QA Engineer',
                'DevOps Engineer',
                'System Administrator',
                'Business Analyst',
                'Product Manager',
                'CTO',
                'CEO',
                'Intern',
                'Junior Developer',
                'Senior Developer',
                'Technical Lead',
                'Architect'
            ];
            this.cdr.detectChanges();
        });
    }

    loadEmployees() {
        const token = localStorage.getItem('token');
        this.loading = true;
        this.cdr.detectChanges();

        const params = new URLSearchParams({
            page: this.currentPage.toString(),
            pageSize: this.pageSize.toString(),
            search: this.searchText,
            status: this.currentStatus
        });

        if (this.selectedDepartmentId) {
            params.append('departmentId', this.selectedDepartmentId);
        }

        fetch(`https://localhost:7141/api/employees?${params}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            this.employees = data.employees || [];
            this.totalEmployees = data.totalEmployees || 0;
            this.totalPages = data.totalPages || 0;
            this.loading = false;
            this.cdr.detectChanges();
        })
        .catch(error => {
            console.error('Error loading employees:', error);
            this.errorMessage = 'Failed to load employees.';
            this.loading = false;
            this.cdr.detectChanges();
        });
    }

    onSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.currentPage = 1;
            this.loadEmployees();
        }, 500);
    }

    onDepartmentFilter() {
        this.currentPage = 1;
        this.loadEmployees();
    }

    filterByStatus(status: string) {
        this.currentStatus = status;
        this.currentPage = 1;
        this.loadEmployees();
    }

    changePage(page: number) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.loadEmployees();
    }

    getPages(): number[] {
        const pages = [];
        for (let i = 1; i <= this.totalPages; i++) {
            pages.push(i);
        }
        return pages;
    }

    openAddModal() {
        this.form = this.emptyForm();
        this.isEditing = false;
        this.selectedPhoto = null;
        this.photoPreview = null;
        this.formError = '';
        this.showFormModal = true;
        this.cdr.detectChanges();
    }

    openEditModal(emp: any) {
        this.form = {
            id: emp.id,
            name: emp.name,
            email: emp.email,
            phone: emp.phone,
            address: emp.address,
            designation: emp.designation,
            salary: emp.salary,
            departmentId: emp.departmentId,
            joiningDate: new Date(emp.joiningDate).toISOString().split('T')[0]
        };
        this.isEditing = true;
        this.selectedPhoto = null;
        this.photoPreview = null;
        this.formError = '';
        this.showFormModal = true;
        this.cdr.detectChanges();
    }

    openViewModal(emp: any) {
        this.selectedEmployee = emp;
        this.showViewModal = true;
        this.cdr.detectChanges();
    }

    closeModals() {
        this.showFormModal = false;
        this.showViewModal = false;
        this.showMenu = false;
        this.formError = '';
        this.cdr.detectChanges();
    }

    onPhotoSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.selectedPhoto = file;
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.photoPreview = e.target.result;
                this.cdr.detectChanges();
            };
            reader.readAsDataURL(file);
        }
    }

    saveEmployee() {
        if (!this.form.name || !this.form.email ||
            !this.form.phone || !this.form.address ||
            !this.form.designation || !this.form.salary ||
            !this.form.departmentId) {
            this.formError = 'Please fill in all required fields';
            this.cdr.detectChanges();
            return;
        }

        this.saving = true;
        this.formError = '';

        const token = localStorage.getItem('token');
        const formData = new FormData();

        formData.append('name', this.form.name);
        formData.append('email', this.form.email);
        formData.append('phone', this.form.phone);
        formData.append('address', this.form.address);
        formData.append('designation', this.form.designation);
        formData.append('salary', this.form.salary.toString());
        formData.append('departmentId', this.form.departmentId.toString());
        formData.append('joiningDate', this.form.joiningDate);

        if (this.selectedPhoto) {
            formData.append('photo', this.selectedPhoto);
        }

        const url = this.isEditing
            ? `https://localhost:7141/api/employees/${this.form.id}`
            : 'https://localhost:7141/api/employees';

        const method = this.isEditing ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        })
        .then(async response => {
            const data = await response.json();
            return { status: response.status, data };
        })
        .then(result => {
            this.saving = false;
            if (result.status === 200 || result.status === 201) {
                this.successMessage = this.isEditing
                    ? 'Employee updated successfully!'
                    : 'Employee added successfully!';
                this.closeModals();
                this.loadEmployees();
                setTimeout(() => {
                    this.successMessage = '';
                    this.cdr.detectChanges();
                }, 3000);
            } else {
                this.formError = result.data.message || 'Failed to save employee.';
            }
            this.cdr.detectChanges();
        })
        .catch(error => {
            console.error('Error saving employee:', error);
            this.saving = false;
            this.formError = 'Something went wrong.';
            this.cdr.detectChanges();
        });
    }

    deactivate(id: number) {
        if (!confirm('Deactivate this employee?')) return;
        const token = localStorage.getItem('token');

        fetch(`https://localhost:7141/api/employees/${id}/deactivate`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            this.successMessage = 'Employee deactivated successfully!';
            this.loadEmployees();
            setTimeout(() => {
                this.successMessage = '';
                this.cdr.detectChanges();
            }, 3000);
            this.cdr.detectChanges();
        })
        .catch(error => {
            console.error('Error deactivating employee:', error);
            this.errorMessage = 'Failed to deactivate employee.';
            setTimeout(() => {
                this.errorMessage = '';
                this.cdr.detectChanges();
            }, 3000);
            this.cdr.detectChanges();
        });
    }

    restore(id: number) {
        if (!confirm('Restore this employee?')) return;
        const token = localStorage.getItem('token');

        fetch(`https://localhost:7141/api/employees/${id}/restore`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            this.successMessage = 'Employee restored successfully!';
            this.loadEmployees();
            setTimeout(() => {
                this.successMessage = '';
                this.cdr.detectChanges();
            }, 3000);
            this.cdr.detectChanges();
        })
        .catch(error => {
            console.error('Error restoring employee:', error);
            this.errorMessage = 'Failed to restore employee.';
            setTimeout(() => {
                this.errorMessage = '';
                this.cdr.detectChanges();
            }, 3000);
            this.cdr.detectChanges();
        });
    }

    delete(id: number) {
        if (!confirm('Permanently delete this employee? This cannot be undone!')) return;
        const token = localStorage.getItem('token');

        fetch(`https://localhost:7141/api/employees/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            this.successMessage = 'Employee deleted successfully!';
            this.loadEmployees();
            setTimeout(() => {
                this.successMessage = '';
                this.cdr.detectChanges();
            }, 3000);
            this.cdr.detectChanges();
        })
        .catch(error => {
            console.error('Error deleting employee:', error);
            this.errorMessage = 'Failed to delete employee.';
            setTimeout(() => {
                this.errorMessage = '';
                this.cdr.detectChanges();
            }, 3000);
            this.cdr.detectChanges();
        });
    }

    toggleMenu() {
        this.showMenu = !this.showMenu;
        this.cdr.detectChanges();
    }

    toggleSidebar() {
        this.showSidebar = !this.showSidebar;
        this.cdr.detectChanges();
    }

    goToAdmin() {
        this.router.navigate(['/admin']);
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