import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MenuItem {
    id: number;
    menuName: string;
    url: string;
    icon: string;
    isParent: boolean;
    children?: MenuItem[];
}

@Injectable({
    providedIn: 'root'
})
export class MenuService {
    private apiUrl = 'https://localhost:7141/api/menu';

    constructor(private http: HttpClient) {}

    getUserMenus(): Observable<MenuItem[]> {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        console.log('Token in MenuService:', token ? 'Present' : 'Missing');
        
        // Create headers with authorization
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });
        
        // Make request with headers
        return this.http.get<MenuItem[]>(`${this.apiUrl}/user-menus`, { headers });
    }
}