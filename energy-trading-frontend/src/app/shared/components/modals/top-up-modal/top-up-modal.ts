import { Component, Inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PaymentService } from '../../../../core/services/payment.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ErrorService } from '../../../../core/services/error.service';
import {loadStripe, Stripe, StripeElements, StripeCardElement} from '@stripe/stripe-js';
import { firstValueFrom } from 'rxjs';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51TCK9dPFFK2E7d9UrYu4I3Bsyu5ROCoBbqLRHpJ7Cg9xXF2Ujo79nffZmnCGiR5mvpYvPzAtJJE3B9lvDPltXKQ600hSEAI7ON';

@Component({
  selector: 'app-top-up-modal',
  imports: [FormsModule, DecimalPipe, TranslateModule],
  templateUrl: './top-up-modal.html',
  styleUrl: './top-up-modal.css',
})
export class TopUpModalComponent implements OnInit, OnDestroy {

  amount: string = '';
  isSubmitting = false;
  isCardReady = false;
  cardError: string = '';
  

  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private cardElement: StripeCardElement | null = null;

  
  constructor(
    public dialogRef: DialogRef<string>,
    @Inject(DIALOG_DATA) public data: any,
    private paymentService: PaymentService,
    private toastService: ToastService,
    private translate: TranslateService,
    private errorService: ErrorService,
    private cdr: ChangeDetectorRef
  ){}
  
  async ngOnInit(): Promise<void> {
    this.stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
    if(!this.stripe) return;

    this.elements = this.stripe.elements();

    this.cardElement = this.elements.create('card', {
      style: {
        base: {
          color: '#ffffff',
          fontFamily: 'inherit',
          fontSize: '14px',
          '::placeholder': { color: '#6b7280'},
          backgroundColor: '#1f2937'
        },
        invalid: {color: '#f87171'}
      }
    });

    setTimeout(() => {
      this.cardElement!.mount('#card-element');
      this.cardElement!.on('change', (event) => {
        this.cardError = event.error ? event.error.message : '';
        this.isCardReady = event.complete;
        this.cdr.detectChanges();
      });
    }, 100);
  }

  get calculatedCredits(): number{
    const amt = parseFloat(this.amount);
    return isNaN(amt) ? 0 : amt * 10;
  }

  async submit(){
    if(!this.stripe || !this.cardElement || !this.amount) return;
    const amt = parseFloat(this.amount);
    if (isNaN(amt) || amt < 500) return;

    this.isSubmitting = true;

    try{
      const intentResponse = await firstValueFrom(this.paymentService.createPaymentIntent(amt));

      const result = await this.stripe.confirmCardPayment(
        intentResponse.clientSecret,
        { payment_method: {card: this.cardElement }}
      );

      if(result.error){
        this.cardError = result.error.message ?? '';
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }else if(result.paymentIntent.status === 'succeeded'){
        this.toastService.success(
          this.translate.instant('modals.topUpCredits.success')
        );
        this.dialogRef.close('success');
      }
    }catch(err){
      this.toastService.error(this.errorService.getErrorMessage(err));
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  cancel(){
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.cardElement?.unmount();
  }
}
