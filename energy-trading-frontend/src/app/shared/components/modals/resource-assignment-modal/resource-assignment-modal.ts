import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ResourceTypeService } from '../../../../core/services/resource-type.service';
import { CompanyResourcesService } from '../../../../core/services/company-resources.service';
import { ToastService } from '../../../../core/services/toast.service';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ErrorService } from '../../../../core/services/error.service';

export interface ResourceAssignmentData {
  companyId: number;
  companyName: string;
}

@Component({
  selector: 'app-resource-assignment-modal',
  imports: [FormsModule, TranslateModule],
  templateUrl: './resource-assignment-modal.html',
  styleUrl: './resource-assignment-modal.css'
})
export class ResourceAssignmentModalComponent implements OnInit{

  allResourceTypes: any[] = [];
  companyResources: any[] = [];
  isLoading = true;

  // ── Pagination + keresés ──────────────────────────────────
  resourceSearch: string = '';
  resourcePage: number = 0;
  resourcePageSize: number = 3;

  constructor(
    public dialogRef: DialogRef<string>,
    @Inject(DIALOG_DATA) public data: ResourceAssignmentData,
    private companyResourcesService: CompanyResourcesService,
    private resourceTypeService: ResourceTypeService,
    private toastService: ToastService,
    private errorService: ErrorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.resourceTypeService.getAllResourceTypes().subscribe({
      next: (types) => {
        this.allResourceTypes = types;
        this.companyResourcesService.getResourcesByCompany(this.data.companyId).subscribe({
          next: (resources) => {
            this.companyResources = resources;
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.isLoading = false
            this.cdr.detectChanges();
          } 
        });
      },
      error: () => this.isLoading = false
    });
  }

  hasResource(resourceName: string): boolean {
    return this.companyResources.some(r => r.resourceTypeName === resourceName);
  }

  toggleResource(resourceType: any) {
    if (this.hasResource(resourceType.name)) {
      this.companyResourcesService.removeResource(this.data.companyId, resourceType.id).subscribe({
        next: () => {
          this.companyResources = this.companyResources.filter(r => r.resourceTypeName !== resourceType.name);
          this.cdr.detectChanges();
        },
        error: (err) => this.toastService.error(this.errorService.getErrorMessage(err))
      });
    } else {
      this.companyResourcesService.addResource(this.data.companyId, resourceType.id).subscribe({
        next: () => {
          this.companyResources = [...this.companyResources, {resourceTypeName: resourceType.name}];
          this.cdr.detectChanges();
        },
        error: (err) => this.toastService.error(this.errorService.getErrorMessage(err))
      });
    }
  }

  close() {
    this.dialogRef.close('changed');
  }

  get filteredResourceTypes(): any[] {
    if (!this.resourceSearch) return this.allResourceTypes;
    return this.allResourceTypes.filter(rt =>
      rt.name.toLowerCase().includes(this.resourceSearch.toLowerCase())
    );
  }

  get paginatedResourceTypes(): any[] {
    const start = this.resourcePage * this.resourcePageSize;
    return this.filteredResourceTypes.slice(start, start + this.resourcePageSize);
  }

  get resourceTotalPages(): number {
    return Math.ceil(this.filteredResourceTypes.length / this.resourcePageSize);
  }

  onResourceSearch() {
    this.resourcePage = 0;
  }
}