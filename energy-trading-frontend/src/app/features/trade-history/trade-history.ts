import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TradeOfferService } from '../../core/services/trade-offers.service';
import { AuthService } from '../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, TrendingUp, TrendingDown, Filter, ArrowUpDown } from 'lucide-angular';

@Component({
  selector: 'app-trade-history',
  imports: [DecimalPipe, DatePipe, FormsModule, TranslateModule, LucideAngularModule],
  templateUrl: './trade-history.html',
  styleUrl: './trade-history.css',
})
export class TradeHistoryComponent implements OnInit{

  readonly TrendingUp = TrendingUp;
  readonly TrendingDown = TrendingDown;
  readonly Filter = Filter;
  readonly ArrowUpDown = ArrowUpDown;
  
  offers: any[] = [];
  isLoading = true;
  isAdmin = false;
  isDispatcher = false;
  search = '';
  resourceSearch: string = '';
  isInitialLoading = true;

  // Pagination
  page = 0;
  pageSize = 5;
  totalPages = 0;
  totalElements = 0;

  // Szűrők
  statusFilter: string = '';
  offerTypeFilter: string = '';
  resourceTypeFilter: string = '';
  filterDropdownOpen = false;

  // Rendezés
  sortField = 'createdAt';
  sortDirection = 'desc';
  sortDropdownOpen = false;

  constructor(
    private tradeOfferService: TradeOfferService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ){}

  ngOnInit(): void {
    const role = this.authService.getRole();
    this.isAdmin = role === 'ADMIN';
    this.isDispatcher = role === 'DISPATCHER';
    this.loadHistory();
  }

  loadHistory(){
    this.isLoading = true;
    this.tradeOfferService.getTradeHistory({
      page: this.page,
      size: this.pageSize,
      sort: this.sortField,
      direction: this.sortDirection,
      status: this.statusFilter || undefined,
      offerType: this.offerTypeFilter || undefined,
      resourceType: this.resourceSearch || undefined,
      search: this.search || undefined
    }).subscribe({
      next: (data) => {
        this.offers = data.content;
        this.totalPages = data.totalPages;
        this.totalElements = data.totalElements;
        this.isLoading = false;
        this.isInitialLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.isInitialLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearch() {
    this.page = 0;
    this.loadHistory();
  }

  onResourceSearch() {
    this.page = 0;
    this.loadHistory();
  }

  setStatusFilter(value: string){
    this.statusFilter = this.statusFilter === value ? '' : value;
    this.page = 0;
    this.loadHistory();
  }

  setOfferTypeFilter(value: string){
    this.offerTypeFilter = this.offerTypeFilter === value ? '' : value;
    this.page = 0;
    this.loadHistory();
  }

  setSort(field: string, direction: string){
    this.sortField = field;
    this.sortDirection = direction;
    this.page = 0;
    this.sortDropdownOpen = false;
    this.loadHistory();
  }

  prevPage(){
    if (this.page > 0){this.page--; this.loadHistory(); }
  }

  nextPage(){
    if (this.page < this.totalPages - 1) {this.page++; this.loadHistory(); }
  }

  get hasActiveFilter(): boolean{
    return !!this.statusFilter || !!this.offerTypeFilter;
  }

  @HostListener('document:click')
  closeDropdowns(){
    this.filterDropdownOpen = false;
    this.sortDropdownOpen = false;
    this.cdr.detectChanges();
  }
}
