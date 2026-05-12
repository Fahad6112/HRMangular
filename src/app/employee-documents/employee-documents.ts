import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-employee-documents',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './employee-documents.html',
    styleUrls: ['./employee-documents.css']
})
export class EmployeeDocumentsComponent implements OnInit {
    employeeId: number = 0;
    employeeName: string = '';
    employeeDetails: any = null;
    documents: any[] = [];
    loading: boolean = true;
    error: string = '';
    apiUrl: string = 'https://localhost:7141';
    showMenu: boolean = false;
    showSidebar: boolean = false;
    email: string = '';
    fullName: string = '';
    profileImage: string | null = null;
    showImageViewer: boolean = false;
    imageDocuments: any[] = [];
    currentImageIndex: number = 0;
    currentImageUrl: string = '';
    currentImageDoc: any = null;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.email = localStorage.getItem('email') || '';
        this.fullName = localStorage.getItem('fullName') || '';
        this.profileImage = localStorage.getItem('profileImage') || null;
        
        this.route.params.subscribe(params => {
            this.employeeId = +params['id'];
            this.route.queryParams.subscribe(queryParams => {
                this.employeeName = queryParams['name'] || 'Employee';
                if (this.employeeId) {
                    this.loadEmployeeDetails();
                    this.loadDocuments();
                }
            });
        });
    }

    formatSalary(salary: number): string {
        return salary ? salary.toLocaleString() : '0';
    }

    loadEmployeeDetails() {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        fetch(`https://localhost:7141/api/employees/${this.employeeId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            this.employeeDetails = data;
            this.cdr.detectChanges();
        })
        .catch(err => console.error('Error loading employee details:', err));
    }

    loadDocuments() {
        const token = localStorage.getItem('token');
        if (!token) {
            this.error = 'No authentication token found';
            this.loading = false;
            return;
        }
        
        this.loading = true;
        
        fetch(`https://localhost:7141/api/employees/${this.employeeId}/documents`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            if (response.status === 401) {
                this.router.navigate(['/login']);
                throw new Error('Session expired');
            }
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            this.documents = Array.isArray(data) ? data : [];
            this.loading = false;
            this.cdr.detectChanges();
        })
        .catch(error => {
            this.error = error.message || 'Failed to load documents';
            this.loading = false;
            this.cdr.detectChanges();
        });
    }

    deleteDocument(docId: number, event: Event) {
        event.stopPropagation();
        if (!confirm('Are you sure you want to delete this document?')) return;
        
        const token = localStorage.getItem('token');
        if (!token) return;
        
        fetch(`https://localhost:7141/api/employees/documents/${docId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            if (!response.ok) throw new Error('Delete failed');
            return response.json();
        })
        .then(() => {
            alert('Document deleted successfully');
            this.loadDocuments();
        })
        .catch(error => {
            alert('Failed to delete document: ' + error.message);
        });
    }

    openImageViewer(index: number) {
        // Filter only image documents
        this.imageDocuments = this.documents.filter(doc => 
            this.isImageFile(doc.documentName)
        );
        
        if (this.imageDocuments.length === 0) {
            // If no images, open the document in new tab
            const doc = this.documents[index];
            if (doc) {
                window.open(this.apiUrl + doc.documentPath, '_blank');
            }
            return;
        }
        
        // Find the index in the filtered image array
        const currentDoc = this.documents[index];
        this.currentImageIndex = this.imageDocuments.findIndex(doc => doc.id === currentDoc.id);
        if (this.currentImageIndex === -1) this.currentImageIndex = 0;
        
        this.currentImageDoc = this.imageDocuments[this.currentImageIndex];
        this.currentImageUrl = this.apiUrl + this.currentImageDoc.documentPath;
        this.showImageViewer = true;
        document.body.style.overflow = 'hidden';
    }

    closeImageViewer() {
        this.showImageViewer = false;
        this.imageDocuments = [];
        document.body.style.overflow = '';
    }

    nextImage() {
        if (this.currentImageIndex < this.imageDocuments.length - 1) {
            this.currentImageIndex++;
            this.currentImageDoc = this.imageDocuments[this.currentImageIndex];
            this.currentImageUrl = this.apiUrl + this.currentImageDoc.documentPath;
        }
    }

    previousImage() {
        if (this.currentImageIndex > 0) {
            this.currentImageIndex--;
            this.currentImageDoc = this.imageDocuments[this.currentImageIndex];
            this.currentImageUrl = this.apiUrl + this.currentImageDoc.documentPath;
        }
    }

    isImageFile(filename: string): boolean {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    }

    onImageError(event: any) {
        event.target.style.display = 'none';
        const previewIcon = event.target.parentElement?.querySelector('.preview-icon');
        if (previewIcon) {
            previewIcon.style.display = 'flex';
        }
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

    formatFileSize(bytes: number): string {
        if (!bytes || bytes === 0) return '0 B';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getBadgeClass(documentType: string): string {
        switch(documentType) {
            case 'Certificate': return 'badge-primary';
            case 'NID': return 'badge-success';
            case 'ParentsNID': return 'badge-warning';
            case 'Degree': return 'badge-info';
            default: return 'badge-primary';
        }
    }

    toggleMenu() {
        this.showMenu = !this.showMenu;
    }

    toggleSidebar() {
        this.showSidebar = !this.showSidebar;
    }

    goBack() {
        localStorage.setItem('returnToEmployees', 'true');
        this.router.navigate(['/admin']);
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