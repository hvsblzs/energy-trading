import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule, CreditCard } from 'lucide-angular';
import { ModalService } from '../../core/services/modal.service';
import { TopUpModalComponent } from '../../shared/components/modals/top-up-modal/top-up-modal';

@Component({
  selector: 'app-profile',
  imports: [DecimalPipe, DatePipe, TranslateModule, LucideAngularModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {

  readonly CreditCard = CreditCard;

  currentUser: any = null;
  isLoading: boolean = true;

  constructor(
    private userService: UserService,
    private translate: TranslateService,
    private modalService: ModalService, 
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.userService.getMe().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  getRoleBadgeClass(): string {
    switch(this.currentUser?.role) {
      case 'ADMIN': return 'bg-purple-900 text-purple-300 border-purple-700';
      case 'DISPATCHER': return 'bg-blue-900 text-blue-300 border-blue-700';
      default: return 'bg-green-900 text-green-300 border-green-700';
    }
  }

  getRoleLabel(): string {
    switch(this.currentUser?.role) {
      case 'ADMIN': return this.translate.instant('profile.roles.ADMIN');
      case 'DISPATCHER': return this.translate.instant('profile.roles.DISPATCHER');
      default: return this.translate.instant('profile.roles.COMPANY_USER');
    }
  }

  openTopUpModal() {
    const ref = this.modalService.open(TopUpModalComponent);
    ref.closed.subscribe(result => {
      if (result === 'success') {
        this.ngOnInit();
      }
    });
  }
}