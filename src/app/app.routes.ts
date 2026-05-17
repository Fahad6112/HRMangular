import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { LayoutComponent } from './layout/layout';
import { AdminComponent } from './admin/admin';
import { HomeComponent } from './home/home';
import { RegisterComponent } from './register/register';
import { ChangePasswordComponent } from './change-password/change-password';
import { EmployeeComponent } from './employee/employee';
import { EmployeeDashboardComponent } from './employee-dashboard/employee-dashboard';
import { EmployeeDocumentsComponent } from './employee-documents/employee-documents';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'change-password', component: ChangePasswordComponent },
    { path: 'home', component: HomeComponent },
    { path: 'employee', component: EmployeeComponent },
    { path: 'employee-dashboard', component: EmployeeDashboardComponent },
    
    // Admin routes with Layout (sidebar + navbar)
    { 
        path: 'admin', 
        component: LayoutComponent,
        children: [
            { path: '', component: AdminComponent },
            { path: 'employeelist', component: AdminComponent },
            { path: 'createemployee', component: AdminComponent },
            { path: 'tasks', component: AdminComponent },
            { path: 'leaverequests', component: AdminComponent },
            { path: 'leavehistory', component: AdminComponent },
            { path: 'attendance', component: AdminComponent },
            { path: 'documents/:id', component: EmployeeDocumentsComponent }
        ]
    },
    
    { path: '**', redirectTo: '/login' }
];