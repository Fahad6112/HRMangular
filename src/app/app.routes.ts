import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { AdminComponent } from './admin/admin';
import { HomeComponent } from './home/home';
import { RegisterComponent } from './register/register';
import { ChangePasswordComponent } from './change-password/change-password';
import { EmployeeComponent } from './employee/employee';
import { EmployeeDashboardComponent } from './employee-dashboard/employee-dashboard';
import { EmployeeGuard } from './guards/employee.guard';
import { EmployeeDocumentsComponent } from './employee-documents/employee-documents';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'change-password', component: ChangePasswordComponent },
    { 
        path: 'admin', 
        component: AdminComponent,
        children: [
            { path: '', component: AdminComponent },
            { path: 'employeelist', component: AdminComponent },
            { path: 'createemployee', component: AdminComponent },
            { path: 'tasks', component: AdminComponent },
            { path: 'leaverequests', component: AdminComponent },
            { path: 'leavehistory', component: AdminComponent },
            { path: 'attendance', component: AdminComponent }
        ]
    },
    { path: 'admin/documents/:id', component: EmployeeDocumentsComponent },
    { path: 'home', component: HomeComponent },
    { path: 'employee', component: EmployeeComponent },
    { path: 'employee-dashboard', component: EmployeeDashboardComponent },
    { path: '**', redirectTo: '/login' }
];