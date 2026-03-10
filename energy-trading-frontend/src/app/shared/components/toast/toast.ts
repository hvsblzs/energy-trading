import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  imports: [NgClass],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastComponent implements OnInit {

  toasts: Toast[] = [];

  constructor(
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ){}

  ngOnInit(): void {
    this.toastService.toasts.subscribe(toasts => {
      this.toasts = toasts;
      this.cdr.markForCheck();
    });
  }

  remove(id: number){
    this.toastService.remove(id);
  }
}