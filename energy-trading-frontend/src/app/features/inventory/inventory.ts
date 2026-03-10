import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { DecimalPipe, NgStyle } from '@angular/common';
import { CompanyInventoryService } from '../../core/services/company-inventory.service';
import { ResourceTypeService } from '../../core/services/resource-type.service';

interface InventoryItem {
  data: any;
  displayValue: number;
  color: string;
  colorLight: string;
}

@Component({
  selector: 'app-inventory',
  imports: [DecimalPipe],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css'
})
export class InventoryComponent implements OnInit, OnDestroy {

  inventoryItems: InventoryItem[] = [];
  isLoading: boolean = true;
  private animationIntervals: any[] = [];
  private resourceTypeMap: Map<string, any> = new Map();

  constructor(
    private companyInventoryService: CompanyInventoryService,
    private resourceTypeService: ResourceTypeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadResourceTypes();
  }

  loadResourceTypes() {
    this.resourceTypeService.getAllResourceTypes().subscribe({
      next: (types) => {
        types.forEach(type => {
          this.resourceTypeMap.set(type.name, {
            color: type.color,
            colorLight: this.hexToRgba(type.color, 0.15)
          });
        });
        this.loadInventory();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  loadInventory() {
    this.isLoading = true;
    this.inventoryItems = [];
    this.animationIntervals.forEach(i => clearInterval(i));
    this.animationIntervals = [];

    this.companyInventoryService.getMyInventory().subscribe({
      next: (items) => {
        items.forEach((item: any) => {
          const config = this.resourceTypeMap.get(item.resourceTypeName) ?? {
            color: '#10b981',
            colorLight: 'rgba(16, 185, 129, 0.15)'
          };
          this.inventoryItems.push({
            data: item,
            displayValue: 0,
            color: config.color,
            colorLight: config.colorLight
          });
          this.animateValue(this.inventoryItems.length - 1, item.quantity);
        });
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

  animateValue(index: number, targetValue: number) {
    let currentValue = 0;
    const steps = 60;
    const valueIncrement = targetValue / steps;

    const interval = setInterval(() => {
      currentValue += valueIncrement;

      if (currentValue >= targetValue) {
        currentValue = targetValue;
        clearInterval(interval);
      }

      this.inventoryItems[index] = {
        ...this.inventoryItems[index],
        displayValue: Math.round(currentValue)
      };
      this.cdr.detectChanges();
    }, 16);

    this.animationIntervals.push(interval);
  }

  hexToRgba(hex: string, opacity: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  ngOnDestroy() {
    this.animationIntervals.forEach(i => clearInterval(i));
  }
}