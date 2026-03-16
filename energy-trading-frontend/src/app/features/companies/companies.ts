import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { CompanyService } from '../../core/services/company.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { ModalService } from '../../core/services/modal.service';
import { ConfirmDeleteModalComponent } from '../../shared/components/modals/confirm-delete-modal/confirm-delete-modal';
import { CreateCompanyModalComponent } from '../../shared/components/modals/create-company-modal/create-company-modal';
import { EditCompanyModalComponent } from '../../shared/components/modals/edit-company-modal/edit-company-modal';
import { ResourceAssignmentModalComponent } from '../../shared/components/modals/resource-assignment-modal/resource-assignment-modal';
import { AddUserModalComponent } from '../../shared/components/modals/add-user-modal/add-user-modal';
import { CompanyUsersModalComponent } from '../../shared/components/modals/company-users-modal/company-users-modal';
import { LucideAngularModule, Plus, Building2, Phone, MapPin, CircleDollarSign} from 'lucide-angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-companies',
  imports: [FormsModule, DecimalPipe, LucideAngularModule],
  templateUrl: './companies.html',
  styleUrl: './companies.css'
})
export class CompaniesComponent implements OnInit {

  // Icons
  readonly Plus = Plus;
  readonly Building2 = Building2;
  readonly Phone = Phone;
  readonly MapPin = MapPin;
  readonly CircleDollarSign = CircleDollarSign;

  // Pagination + szűrés + rendezés
  page: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  totalElements: number = 0;
  search: string = '';
  sortField: string = 'name';
  sortDirection: string = 'asc';
  activeFilter: boolean | null = null;
  filterDropdownOpen: boolean = false;
  sortDropdownOpen: boolean = false;
  openMenuId: number | null = null;

  companies: any[] = [];
  isLoading: boolean = true;
  isAdmin: boolean = false;

  constructor(
    private companyService: CompanyService,
    private toastService: ToastService,
    private authService: AuthService,
    private modalService: ModalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.isAdmin = this.authService.getRole() === 'ADMIN';
    this.isLoading = true;
    this.loadCompanies();
  }

  loadCompanies() {
    this.companyService.getAllCompanies({
      page: this.page,
      size: this.pageSize,
      sort: this.sortField,
      direction: this.sortDirection,
      search: this.search,
      active: this.activeFilter
    }).subscribe({
      next: (data) => {
        this.companies = data.content;
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

  // Create
  openCreateModal() {
    const ref = this.modalService.open(CreateCompanyModalComponent);
    ref.closed.subscribe(result => {
      if (result === 'created') this.loadCompanies();
    });
  }

  // Edit
  openEditModal(company: any) {
    const ref = this.modalService.open(EditCompanyModalComponent, {
      id: company.id,
      name: company.name,
      email: company.email,
      phone: company.phone,
      address: company.address,
      creditBalance: company.creditBalance
    });
    ref.closed.subscribe(result => {
      if (result === 'updated') this.loadCompanies();
    });
  }

  // Resources
  openResourceModal(company: any) {
    this.modalService.open(ResourceAssignmentModalComponent, {
      companyId: company.id,
      companyName: company.name
    });
  }

  // Add user
  openAddUserModal(company: any){
    this.modalService.open(AddUserModalComponent, {
      companyId: company.id,
      companyName: company.name
    });
  }

  // Activate/Deactivate
  toggleActive(company: any) {
    if (company.isActive) {
      this.companyService.deactivateCompany(company.id).subscribe({
        next: () => {
          this.toastService.success('Cég deaktiválva!');
          this.loadCompanies();
        },
        error: (err) => this.toastService.error(err.error?.error ?? 'Hiba történt!')
      });
    } else {
      this.companyService.activateCompany(company.id).subscribe({
        next: () => {
          this.toastService.success('Cég aktiválva!');
          this.loadCompanies();
        },
        error: (err) => this.toastService.error(err.error?.error ?? 'Hiba történt!')
      });
    }
  }

  // Errors
  private isValidEmail(email: string): boolean{
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Delete
  openDeleteModal(company: any){
    const ref = this.modalService.open(ConfirmDeleteModalComponent, {
      title: 'Cég törlése',
      itemName: company.name,
      message: 'céget? Ez a művelet nem visszavonható, a hozzá tartozó felhasználó is törlődik.'
    });
    ref.closed.subscribe(result => {
      if (result === 'confirmed') {
        this.companyService.deleteCompany(company.id).subscribe({
          next: () => {
            this.toastService.success('Cég sikeresen törölve!');
            this.loadCompanies();
          },
          error: (err) => this.toastService.error(err.error?.error ?? 'Hiba történt!')
        });
      }
    });
  }

  // Search + sort
  onSearch(){
    this.page = 0;
    this.loadCompanies();
  }

  setSort(field: string, direction: string){
    this.sortField = field;
    this.sortDirection = direction;
    this.page = 0;
    this.sortDropdownOpen = false;
    this.loadCompanies();
  }

  setActiveFilter(value: boolean | null){
    this.activeFilter = this.activeFilter === value ? null : value;
    this.page = 0;
    this.loadCompanies();
  }

  prevPage(){
    if(this.page > 0){ this.page--; this.loadCompanies(); }
  }

  nextPage(){
    if(this.page < this.totalPages - 1){ this.page++; this.loadCompanies(); }
  }

  @HostListener('document:click')
  closeDropdowns(){
    this.filterDropdownOpen = false;
    this.sortDropdownOpen = false;
    this.openMenuId = null;
    this.cdr.detectChanges();
  }

  // Company userek modal
  openCompanyUsersModal(company: any){
    this.modalService.open(CompanyUsersModalComponent, {
      companyId: company.id,
      companyName: company.name
    });
  }

  toggleMenu(event: MouseEvent, companyId: number){
    event.stopPropagation();
    this.openMenuId = this.openMenuId === companyId ? null : companyId;
  }
}