import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { CompanyService } from '../../core/services/company.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { ModalService } from '../../core/services/modal.service';
import { ConfirmDeleteModalComponent } from '../../shared/components/modals/confirm-delete-modal/confirm-delete-modal';
import { CreateCompanyModalComponent } from '../../shared/components/modals/create-company-modal/create-company-modal';
import { EditCompanyModalComponent } from '../../shared/components/modals/edit-company-modal/edit-company-modal';
import { ResourceAssignmentModalComponent } from '../../shared/components/modals/resource-assignment-modal/resource-assignment-modal';
import { LucideAngularModule, Plus, Building2, Phone, MapPin, CircleDollarSign} from 'lucide-angular';

@Component({
  selector: 'app-companies',
  imports: [DecimalPipe, LucideAngularModule],
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
    this.loadCompanies();
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
}