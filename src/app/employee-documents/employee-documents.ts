import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
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

    // Navbar / Sidebar
    showMenu: boolean = false;
    showSidebar: boolean = false;
    email: string = '';
    fullName: string = '';
    profileImage: string | null = null;

    // Image viewer
    showImageViewer: boolean = false;
    imageDocuments: any[] = [];
    currentImageIndex: number = 0;
    currentImageUrl: string = '';
    currentImageDoc: any = null;

    // PDF (removed iframe — opens in new tab instead)
    currentDocument: any = null;

    // Employee info PDF generation flag
    generatingPdf: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {}

    // =====================================================
    // Close profile menu when clicking outside
    // =====================================================
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.profile-wrapper') && !target.closest('.profile-menu')) {
            if (this.showMenu) {
                this.showMenu = false;
                this.cdr.detectChanges();
            }
        }
    }

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

    // =====================================================
    // DATA LOADING
    // =====================================================
    loadEmployeeDetails() {
        const token = localStorage.getItem('token');
        if (!token) return;

        fetch(`${this.apiUrl}/api/employees/${this.employeeId}`, {
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

        fetch(`${this.apiUrl}/api/employees/${this.employeeId}/documents`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            if (response.status === 401) { this.router.navigate(['/login']); throw new Error('Session expired'); }
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
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

    // =====================================================
    // DOCUMENT VIEWER
    // openDocument: images → in-app viewer, PDFs/others → new tab
    // =====================================================
    openDocument(doc: any) {
        if (this.isImageFile(doc.documentName)) {
            // Build image-only list and open in-app viewer
            this.imageDocuments = this.documents.filter(d => this.isImageFile(d.documentName));
            this.currentImageIndex = this.imageDocuments.findIndex(d => d.id === doc.id);
            if (this.currentImageIndex === -1) this.currentImageIndex = 0;
            this.currentImageDoc = this.imageDocuments[this.currentImageIndex];
            this.currentImageUrl = this.apiUrl + this.currentImageDoc.documentPath;
            this.showImageViewer = true;
            document.body.style.overflow = 'hidden';
        } else {
            // PDFs and other files: open directly in a new browser tab
            // This works for localhost because the browser handles it natively
            window.open(this.apiUrl + doc.documentPath, '_blank');
        }
    }

    // =====================================================
// DOWNLOAD using XMLHttpRequest (works with auth headers)
// =====================================================
downloadDocument(doc: any) {
    const token = localStorage.getItem('token');
    const url = this.apiUrl + doc.documentPath;
    
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.responseType = 'blob';
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            const blob = xhr.response;
            const link = document.createElement('a');
            const objectUrl = URL.createObjectURL(blob);
            link.href = objectUrl;
            link.download = doc.documentName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(objectUrl);
        } else {
            console.error('Download failed:', xhr.status);
            alert('Download failed. Please try again.');
        }
    };
    
    xhr.onerror = function() {
        console.error('Network error');
        alert('Network error. Please try again.');
    };
    
    xhr.send();
}

    // =====================================================
    // EMPLOYEE INFO PDF — pure HTML → print window (no library needed)
    // =====================================================
    downloadEmployeeInfoPdf() {
        if (!this.employeeDetails) return;
        this.generatingPdf = true;
        this.cdr.detectChanges();

        const emp = this.employeeDetails;
        const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Employee Profile — ${emp.name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; }
  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
  .header h1 { font-size: 26px; margin-bottom: 6px; }
  .header p { font-size: 13px; opacity: 0.85; }
  .header-right { text-align: right; font-size: 12px; opacity: 0.85; }
  .badges { display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
  .badge { background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; }
  .section { background: #f8f9fa; border-radius: 10px; padding: 20px 24px; margin-bottom: 20px; border-left: 4px solid #667eea; }
  .section h2 { font-size: 15px; font-weight: 600; color: #667eea; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
  .row { display: flex; padding: 8px 0; border-bottom: 1px solid #e8e8e8; }
  .row:last-child { border-bottom: none; }
  .label { width: 160px; font-size: 12px; color: #6c757d; font-weight: 500; text-transform: uppercase; letter-spacing: 0.3px; flex-shrink: 0; padding-top: 1px; }
  .value { font-size: 14px; color: #1a1a2e; font-weight: 500; flex: 1; }
  .stats-row { display: flex; gap: 20px; margin-top: 12px; }
  .stat-box { background: rgba(255,255,255,0.2); padding: 10px 16px; border-radius: 8px; text-align: center; }
  .stat-box .num { font-size: 20px; font-weight: 700; }
  .stat-box .lbl { font-size: 11px; opacity: 0.85; margin-top: 2px; }
  .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #6c757d; border-top: 1px solid #e0e0e0; padding-top: 16px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <h1>${emp.name}</h1>
    <p>Employee ID: #${emp.id}</p>
    <div class="badges">
      <span class="badge">${emp.designation || 'N/A'}</span>
      <span class="badge">${emp.departmentName || 'N/A'}</span>
      <span class="badge">${emp.isActive ? '✅ Active' : '❌ Inactive'}</span>
    </div>
    <div class="stats-row">
      <div class="stat-box"><div class="num">${this.calculateExperience(emp.joiningDate)}</div><div class="lbl">Experience</div></div>
      <div class="stat-box"><div class="num">${this.documents.length}</div><div class="lbl">Documents</div></div>
      <div class="stat-box"><div class="num">$${this.formatSalary(emp.salary)}</div><div class="lbl">Salary</div></div>
    </div>
  </div>
  <div class="header-right">
    <div>Generated on</div>
    <div style="font-size:14px;font-weight:600;margin-top:4px;">${today}</div>
    <div style="margin-top:8px;">HRMApp</div>
  </div>
</div>

<div class="section">
  <h2>👤 Personal Details</h2>
  <div class="row"><div class="label">Full Name</div><div class="value">${emp.name || 'N/A'}</div></div>
  <div class="row"><div class="label">Gender</div><div class="value">${emp.gender || 'Not specified'}</div></div>
  <div class="row"><div class="label">Date of Birth</div><div class="value">${this.formatDate(emp.dateOfBirth)}</div></div>
  <div class="row"><div class="label">Education</div><div class="value">${emp.education || 'Not specified'}</div></div>
  <div class="row"><div class="label">Institute</div><div class="value">${emp.instituteName || 'Not specified'}</div></div>
  <div class="row"><div class="label">Joining Date</div><div class="value">${this.formatDate(emp.joiningDate)}</div></div>
</div>

<div class="section">
  <h2>📞 Contact Information</h2>
  <div class="row"><div class="label">Email Address</div><div class="value">${emp.email || 'N/A'}</div></div>
  <div class="row"><div class="label">Phone Number</div><div class="value">${emp.phone || 'Not specified'}</div></div>
  <div class="row"><div class="label">Address</div><div class="value">${emp.address || 'Not specified'}</div></div>
</div>

<div class="section">
  <h2>💼 Professional Information</h2>
  <div class="row"><div class="label">Department</div><div class="value">${emp.departmentName || 'N/A'}</div></div>
  <div class="row"><div class="label">Designation</div><div class="value">${emp.designation || 'N/A'}</div></div>
  <div class="row"><div class="label">Salary</div><div class="value">$${this.formatSalary(emp.salary)}</div></div>
  <div class="row"><div class="label">Experience</div><div class="value">${this.calculateExperience(emp.joiningDate)}</div></div>
</div>

<div class="footer">
  This document was generated by HRMApp on ${today}. It is confidential and intended for authorized personnel only.
</div>
</body>
</html>`;

        // Open in a hidden print window — works without any external library
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) {
            alert('Pop-up blocked. Please allow pop-ups for this site and try again.');
            this.generatingPdf = false;
            this.cdr.detectChanges();
            return;
        }

        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Wait for content to render, then trigger print dialog (Save as PDF)
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
                this.generatingPdf = false;
                this.cdr.detectChanges();
            }, 400);
        };
    }

    // =====================================================
    // DELETE DOCUMENT
    // =====================================================
    deleteDocument(docId: number, event: Event) {
        event.stopPropagation();
        if (!confirm('Are you sure you want to delete this document?')) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        fetch(`${this.apiUrl}/api/employees/documents/${docId}`, {
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
        .catch(error => alert('Failed to delete document: ' + error.message));
    }

    // =====================================================
    // IMAGE VIEWER NAVIGATION
    // =====================================================
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

    onImageError(event: any) {
        event.target.style.display = 'none';
    }

    // =====================================================
    // HELPERS
    // =====================================================
    isPdfFile(filename: string): boolean {
        return filename?.toLowerCase().endsWith('.pdf') ?? false;
    }

    isImageFile(filename: string): boolean {
        const exts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        return exts.some(ext => filename?.toLowerCase().endsWith(ext));
    }

    getDocumentsByType(type: string): any[] {
        return this.documents.filter(doc => doc.documentType === type);
    }

    getDocumentIndex(docId: number): number {
        return this.documents.findIndex(doc => doc.id === docId);
    }

    formatDate(dateString: string): string {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch { return dateString; }
    }

    formatSalary(salary: number): string {
        return salary ? salary.toLocaleString() : '0';
    }

    formatFileSize(bytes: number): string {
        if (!bytes || bytes === 0) return '0 B';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    }

    calculateExperience(joiningDate: string): string {
        if (!joiningDate) return 'N/A';
        const join = new Date(joiningDate);
        const today = new Date();
        const years = today.getFullYear() - join.getFullYear();
        const months = today.getMonth() - join.getMonth();
        if (years > 0) return `${years} year${years > 1 ? 's' : ''}`;
        if (months > 0) return `${months} month${months > 1 ? 's' : ''}`;
        return 'Less than a month';
    }

    truncateText(text: string, maxLength: number): string {
        if (!text || text.length <= maxLength) return text || '';
        return text.substring(0, maxLength) + '...';
    }

    getBadgeClass(documentType: string): string {
        const map: any = { Certificate: 'badge-primary', NID: 'badge-success', ParentsNID: 'badge-warning', Degree: 'badge-info' };
        return map[documentType] || 'badge-primary';
    }

    // =====================================================
    // NAV
    // =====================================================
    toggleMenu() { this.showMenu = !this.showMenu; }
    toggleSidebar() { this.showSidebar = !this.showSidebar; }

    goBack() {
        localStorage.setItem('returnToEmployees', 'true');
        this.router.navigate(['/admin']);
    }

    goToAdminPanel() {
        localStorage.removeItem('returnToEmployees');
        this.router.navigate(['/admin']);
    }

    logout() {
        ['token', 'role', 'email', 'fullName', 'profileImage'].forEach(k => localStorage.removeItem(k));
        this.router.navigate(['/login']);
    }
}