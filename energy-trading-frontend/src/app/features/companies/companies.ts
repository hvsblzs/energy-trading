import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompanyService } from '../../core/services/company.service';
import { CompanyResourcesService } from '../../core/services/company-resources.service';
import { ResourceTypeService } from '../../core/services/resource-type.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-companies',
  imports: [DecimalPipe, FormsModule],
  templateUrl: './companies.html',
  styleUrl: './companies.css'
})
export class CompaniesComponent implements OnInit {

  companies: any[] = [];
  allResourceTypes: any[] = [];
  companyToDelete: any = null;
  isLoading: boolean = true;
  isAdmin: boolean = false;

  // Modal states
  showCreateModal: boolean = false;
  showEditModal: boolean = false;
  showResourceModal: boolean = false;
  showDeleteModal: boolean = false;
  selectedCompany: any = null;
  isSubmitting: boolean = false;

  // Create form (cég + user egyben)
  createForm = {
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
    creditBalance: 0,
    userEmail: '',
    password: ''
  };

  // Edit form (csak cég adatok)
  editForm = {
    name: '',
    email: '',
    phone: '',
    address: '',
    creditBalance: 0
  };

  // Resources
  companyResources: any[] = [];
  isLoadingResources: boolean = false;

  // Validation errors
  createErrors = {
    companyName: '',
    companyEmail: '',
    userEmail: '',
    password: ''
  };

  editErrors = {
    name: '',
    email: ''
  };

  constructor(
    private companyService: CompanyService,
    private companyResourcesService: CompanyResourcesService,
    private resourceTypeService: ResourceTypeService,
    private toastService: ToastService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.isAdmin = this.authService.getRole() === 'ADMIN';
    this.loadCompanies();
    this.loadAllResourceTypes();
  }

  loadCompanies() {
    this.isLoading = true;
    this.companyService.getAllCompanies().subscribe({
      next: (companies) => {
        this.companies = companies;
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

  loadAllResourceTypes() {
    this.resourceTypeService.getAllResourceTypes().subscribe({
      next: (types) => {
        this.allResourceTypes = types;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  // Create
  openCreateModal() {
    this.createForm = {
      companyName: '',
      companyEmail: '',
      companyPhone: '',
      companyAddress: '',
      creditBalance: 0,
      userEmail: '',
      password: ''
    };
    this.createErrors = { 
      companyName: '', 
      companyEmail: '', 
      userEmail: '', 
      password: '' 
    };
    this.showCreateModal = true;
  }

  createCompany() {
    if (!this.validateCreateForm()) return;
    this.isSubmitting = true;
    this.companyService.createCompanyWithUser(this.createForm).subscribe({
      next: () => {
        this.toastService.success('Cég sikeresen létrehozva!');
        this.showCreateModal = false;
        this.isSubmitting = false;
        this.loadCompanies();
      },
      error: (err) => {
        this.toastService.error(err.error?.error ?? 'Hiba történt!');
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Edit
  openEditModal(company: any) {
    this.selectedCompany = company;
    this.editForm = {
      name: company.name,
      email: company.email,
      phone: company.phone,
      address: company.address,
      creditBalance: company.creditBalance
    };
    this.showEditModal = true;
  }

  updateCompany() {
    if (!this.selectedCompany ||!this.validateEditForm()) return;
    this.isSubmitting = true;
    this.companyService.updateCompany(this.selectedCompany.id, this.editForm).subscribe({
      next: () => {
        this.toastService.success('Cég sikeresen frissítve!');
        this.showEditModal = false;
        this.isSubmitting = false;
        this.loadCompanies();
      },
      error: (err) => {
        this.toastService.error(err.error?.error ?? 'Hiba történt!');
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Resources
  openResourceModal(company: any) {
    this.selectedCompany = company;
    this.companyResources = [];
    this.showResourceModal = true;
    this.loadCompanyResources(company.id);
  }

  loadCompanyResources(companyId: number) {
    this.isLoadingResources = true;
    this.companyResourcesService.getResourcesByCompany(companyId).subscribe({
      next: (resources) => {
        this.companyResources = resources;
        this.isLoadingResources = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isLoadingResources = false;
        this.cdr.detectChanges();
      }
    });
  }

  hasResource(resourceTypeName: string): boolean {
    return this.companyResources.some(cr => cr.resourceTypeName === resourceTypeName);
  }

  getResourceId(resourceTypeName: string): number | null {
    const found = this.allResourceTypes.find(rt => rt.name === resourceTypeName);
    return found ? found.id : null;
  }

  toggleResource(resourceType: any) {
    if (!this.selectedCompany) return;
    if (this.hasResource(resourceType.name)) {
      this.companyResourcesService.removeResource(this.selectedCompany.id, resourceType.id).subscribe({
        next: () => {
          this.toastService.success('Nyersanyag eltávolítva!');
          this.loadCompanyResources(this.selectedCompany.id);
        },
        error: (err) => this.toastService.error(err.error?.error ?? 'Hiba történt!')
      });
    } else {
      this.companyResourcesService.addResource(this.selectedCompany.id, resourceType.id).subscribe({
        next: () => {
          this.toastService.success('Nyersanyag hozzáadva!');
          this.loadCompanyResources(this.selectedCompany.id);
        },
        error: (err) => this.toastService.error(err.error?.error ?? 'Hiba történt!')
      });
    }
  }

  // Activate/Deactivate
  toggleActive(company: any) {
    if (company.active) {
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

  validateCreateForm(): boolean{
    this.createErrors = {companyName: '', companyEmail: '', userEmail: '', password: ''};
    let valid = true;

    if(!this.createForm.companyName.trim()){
      this.createErrors.companyName = 'A cégnév megadása kötelező.';
      valid = false;
    }
    if(!this.createForm.companyEmail.trim()){
      this.createErrors.companyEmail = 'A céges email megadása kötelező.';
      valid = false;
    }
    if(this.createForm.companyEmail && !this.isValidEmail(this.createForm.companyEmail)){
      this.createErrors.companyEmail = 'Érvénytelen email cím.';
      valid = false;
    }
    if(!this.createForm.userEmail.trim()){
      this.createErrors.userEmail = 'A felhasználói email megadása kötelező.';
      valid = false;
    }else if(!this.isValidEmail(this.createForm.userEmail)){
      this.createErrors.userEmail = 'Érvénytelen email cím.';
      valid = false;
    }
    if (!this.createForm.password.trim()) {
      this.createErrors.password = 'A jelszó megadása kötelező.';
      valid = false;
    } else if (this.createForm.password.length < 6) {
      this.createErrors.password = 'A jelszó legalább 6 karakter legyen.';
      valid = false;
    }

    return valid;
  }

  validateEditForm(): boolean{
    this.editErrors = {name: '', email: ''};
    let valid = true;

    if(!this.editForm.name.trim()){
      this.editErrors.name = 'A cégnév megadása kötelező.';
      valid = false;
    }
    if(this.editForm.email && !this.isValidEmail(this.editForm.email)){
      this.editErrors.email = 'Érvénytelen email cím.';
      valid = false;
    }

    return valid;
  }

  // Delete
  openDeleteModal(company: any){
    this.companyToDelete = company;
    this.showDeleteModal = true;
  }

  deleteCompany(){
    if(!this.companyToDelete) return;
    this.isSubmitting = true;
    this.companyService.deleteCompany(this.companyToDelete.id).subscribe({
      next: () => {
        this.toastService.success('Cég sikeresen törölve');
        this.showDeleteModal = false;
        this.companyToDelete = null;
        this.isSubmitting = false;
        this.loadCompanies();
      },
      error: (err) => {
        this.toastService.error(err.error?.error ?? 'Hiba történt!');
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }
}