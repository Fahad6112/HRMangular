import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
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
    { path: 'admin', component: AdminComponent },
    { path: 'admin/employeelist', component: AdminComponent },
    { path: 'admin/createemployee', component: AdminComponent },
    { path: 'admin/tasks', component: AdminComponent },
    { path: 'admin/leaverequests', component: AdminComponent },
    { path: 'admin/leavehistory', component: AdminComponent },
    { path: 'admin/attendance', component: AdminComponent },
    { path: 'admin/documents/:id', component: EmployeeDocumentsComponent },
    { path: 'home', component: HomeComponent },
    { path: 'employee', component: EmployeeComponent },
    { path: 'employee-dashboard', component: EmployeeDashboardComponent },
    { path: '**', redirectTo: '/login' }
];