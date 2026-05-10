import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuService, MenuItem } from '../services/menu.service';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './sidebar.html',
    styleUrls: ['./sidebar.css']
})
export class SidebarComponent implements OnInit {
    menuItems: MenuItem[] = [];
    expandedMenus: Set<number> = new Set();
    
    // Use localStorage so active state persists after re-render
    activeMenu: string = localStorage.getItem('activeMenu') || 'User Management';
    
    @Output() menuClick = new EventEmitter<string>();

    constructor(private menuService: MenuService) {}

    ngOnInit() {
        this.loadMenus();
        // Restore from localStorage if available
        const saved = localStorage.getItem('activeMenu');
        if (saved) {
            this.activeMenu = saved;
        }
    }

    loadMenus() {
        this.menuService.getUserMenus().subscribe({
            next: (menus) => {
                this.menuItems = menus || [];
                // If no saved active menu, default to first item
                const saved = localStorage.getItem('activeMenu');
                if (!saved && this.menuItems.length > 0) {
                    this.activeMenu = this.menuItems[0].menuName;
                }
                console.log('Menus loaded:', this.menuItems);
            },
            error: (error) => {
                console.error('Error loading menus:', error);
                this.loadStaticMenus();
            }
        });
    }

    loadStaticMenus() {
        const role = localStorage.getItem('role');
        
        if (role === 'Admin') {
            this.menuItems = [
                { id: 1, menuName: 'User Management', url: '#', icon: '👥', isParent: false },
                { id: 2, menuName: 'Employee List', url: '#', icon: '👨‍💼', isParent: false },
                { id: 3, menuName: 'Task Management', url: '#', icon: '📋', isParent: false },
                { id: 4, menuName: 'Leave Requests', url: '#', icon: '📅', isParent: false },
                { id: 5, menuName: 'Leave History', url: '#', icon: '📜', isParent: false },
                { id: 6, menuName: 'Attendance Overview', url: '#', icon: '📊', isParent: false }
            ];
            // Default to first menu if nothing saved
            const saved = localStorage.getItem('activeMenu');
            if (!saved) {
                this.activeMenu = this.menuItems[0].menuName;
            }
        }
    }

    onMenuItemClick(menuName: string) {
        this.activeMenu = menuName;
        localStorage.setItem('activeMenu', menuName); // <-- PERSIST IT
        console.log('Menu clicked:', menuName);
        this.menuClick.emit(menuName);
    }

    toggleSubmenu(menuId: number) {
        if (this.expandedMenus.has(menuId)) {
            this.expandedMenus.delete(menuId);
        } else {
            this.expandedMenus.add(menuId);
        }
    }

    isExpanded(menuId: number): boolean {
        return this.expandedMenus.has(menuId);
    }
}