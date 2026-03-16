import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { LucideAngularModule, User } from 'lucide-angular';

@Component({
  selector: 'app-users',
  imports: [DatePipe, LucideAngularModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class UsersComponent implements OnInit {

  readonly User = User;

  users: any[] = [];
  isLoading: boolean = true;
  isAdmin: boolean = false;

  // Pagination + szűrés + rendezés
  page: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  totalElements: number = 0;
  search: string = '';
  sortField: string = 'email';
  sortDirection: string = 'asc';
  activeFilter: boolean | null = null;
  filterDropdownOpen: boolean = false;
  sortDropdownOpen: boolean = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.getRole() === 'ADMIN';
    this.isLoading = true;
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getAllUsers({
      page: this.page,
      size: this.pageSize,
      sort: this.sortField,
      direction: this.sortDirection,
      search: this.search,
      active: this.activeFilter
    }).subscribe({
      next: (data) => {
        this.users = data.content;
        this.totalPages = data.totalPages;
        this.totalElements = data.totalElements;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearch() {
    this.page = 0;
    this.loadUsers();
  }

  setSort(field: string, direction: string) {
    this.sortField = field;
    this.sortDirection = direction;
    this.page = 0;
    this.sortDropdownOpen = false;
    this.loadUsers();
  }

  setActiveFilter(value: boolean) {
    this.activeFilter = this.activeFilter === value ? null : value;
    this.page = 0;
    this.loadUsers();
  }

  prevPage() {
    if (this.page > 0) { this.page--; this.loadUsers(); }
  }

  nextPage() {
    if (this.page < this.totalPages - 1) { this.page++; this.loadUsers(); }
  }

  toggleActive(user: any) {
    if (user.active) {
      this.userService.deactivateUser(user.id).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (err) => console.error(err.error?.error ?? 'Hiba történt!')
      });
    } else {
      this.userService.activateUser(user.id).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (err) => console.error(err.error?.error ?? 'Hiba történt!')
      });
    }
  }

  @HostListener('document:click')
  closeDropdowns(){
    this.filterDropdownOpen = false;
    this.sortDropdownOpen = false;
    this.cdr.detectChanges();
  }
}