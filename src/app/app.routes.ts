import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { AdminComponent } from './admin/admin';
import { HomeComponent } from './home/home';
import { RegisterComponent } from './register/register';
import { ChangePasswordComponent } from './change-password/change-password';
import { EmployeeComponent } from './employee/employee';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'change-password', component: ChangePasswordComponent },
    { path: 'admin', component: AdminComponent },
    { path: 'home', component: HomeComponent },
    { path: 'employee', component: EmployeeComponent },
];