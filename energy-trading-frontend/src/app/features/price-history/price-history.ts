import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexTooltip,
  ApexStroke,
  ApexGrid,
  ApexLegend
} from 'ng-apexcharts';
import { PricingService } from '../../core/services/pricing.service';
import { ResourceTypeService } from '../../core/services/resource-type.service';
import { AuthService } from '../../core/services/auth.service';
import { CompanyResourcesService } from '../../core/services/company-resources.service';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-price-history',
  imports: [FormsModule, NgApexchartsModule, TranslateModule],
  templateUrl: './price-history.html',
  styleUrl: './price-history.css',
})
export class PriceHistoryComponent implements OnInit {

  isLoading: boolean = true;
  allResources: any[] = [];
  companyResources: any[] = [];
  selectedResource: any = null;
  isAdmin: boolean = false;
  isDispatcher: boolean = false;
  isCompanyUser: boolean = false;
  dropdownOpen: boolean = false;
  resourceSearch: string = '';

  // ApexCharts config
  series: ApexAxisChartSeries = [];
  chartConfig: ApexChart = {
    type: 'line',
    height: 400,
    toolbar: { show: false },
    animations: {
      enabled: true,
      speed: 1200,
      animateGradually: {
        enabled: true,
        delay: 150
      },
      dynamicAnimation: {
        enabled: true,
        speed: 350
      }
    },
    background: 'transparent',
  };
  xaxis: ApexXAxis = {
    categories: [],
    labels: {
      style: { colors: '#9ca3af', fontSize: '12px' },
      rotate: -45,
      trim: true,
      offsetX: 10
    },
    tooltip: {
      enabled: false
    }
  };
  yaxis: ApexYAxis = {
    min: 0,
    labels: {
      style: { colors: '#9ca3af', fontSize: '12px' }
    }
  };
  stroke: ApexStroke = {
    curve: 'smooth',
    width: 2
  };
  grid: ApexGrid = {
    borderColor: '#1f2937'
  };
  tooltip: ApexTooltip = {
    theme: 'dark',
    shared: true,
    intersect: false
  };
  legend: ApexLegend = {
    labels: {
      colors: ['#9ca3af', '#9ca3af'],
      useSeriesColors: false
    },
    show: false
  };
  colors: string[] = ['#4ade80', '#f87171'];

  constructor(
    private authService: AuthService,
    private pricingService: PricingService,
    private resourceTypeService: ResourceTypeService,
    private companyResourcesService: CompanyResourcesService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.translate.stream([
      'priceHistory.yaxisTitle',
      'priceHistory.xaxisTitle'
    ]).subscribe(translations => {
      this.yaxis = {
        ...this.yaxis,
        title: {
          text: translations['priceHistory.yaxisTitle'],
          style: { color: '#9ca3af', fontSize: '12px' }
        }
      };
      this.xaxis = {
        ...this.xaxis,
        title: {
          text: translations['priceHistory.xaxisTitle'],
          style: { color: '#9ca3af', fontSize: '12px' }
        }
      };
      this.cdr.detectChanges();
    });
    this.isAdmin = this.authService.getRole() === 'ADMIN';
    this.isDispatcher = this.authService.getRole() === 'DISPATCHER';
    this.isCompanyUser = this.authService.getRole() === 'COMPANY_USER';
    if (this.isAdmin || this.isDispatcher) {
      this.loadAllResources();
    } else {
      this.loadCompanyResources();
    }
  }

  loadAllResources() {
    this.isLoading = true;
    this.resourceTypeService.getAllResourceTypes().subscribe({
      next: (resourceTypes) => {
        this.allResources = resourceTypes;
        this.selectedResource = this.allResources[0];
        this.loadPriceHistory(this.selectedResource.name);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  loadCompanyResources() {
    this.isLoading = true;
    this.companyResourcesService.getMyResources().subscribe({
      next: (resourceTypes) => {
        this.companyResources = resourceTypes;
        this.selectedResource = this.companyResources[0];
        this.loadPriceHistory(this.selectedResource.resourceTypeName);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  loadPriceHistory(resourceName: string) {
    this.pricingService.getAllPricesForResourceType(resourceName).subscribe({
      next: (prices) => {
        const labels = prices.map(p => new Date(p.createdAt).toLocaleString());
        const buyPrices = prices.map(p => p.buyPrice);
        const sellPrices = prices.map(p => p.sellPrice);

        this.xaxis = {
          ...this.xaxis,
          categories: labels
        };

        this.series = [
          { name: this.translate.instant('priceHistory.buyPrice'), data: buyPrices },
          { name: this.translate.instant('priceHistory.sellPrice'), data: sellPrices }
        ];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  get filteredResources(): any[] {
    const resources = (this.isAdmin || this.isDispatcher)
      ? this.allResources
      : this.companyResources;
    if (!this.resourceSearch) return resources;
    if (this.isAdmin || this.isDispatcher) {
      return resources.filter(p => p.name.toLowerCase().includes(this.resourceSearch.toLowerCase()));
    } else {
      return resources.filter(p => p.resourceTypeName.toLowerCase().includes(this.resourceSearch.toLowerCase()));
    }
  }

  selectResource(resource: any) {
    this.selectedResource = resource;
    this.dropdownOpen = false;
    this.resourceSearch = '';
    if (this.isCompanyUser) {
      this.loadPriceHistory(this.selectedResource.resourceTypeName);
    } else {
      this.loadPriceHistory(this.selectedResource.name);
    }
  }

  @HostListener('document:click')
  closeDropdown() {
    this.dropdownOpen = false;
    this.resourceSearch = '';
  }
}