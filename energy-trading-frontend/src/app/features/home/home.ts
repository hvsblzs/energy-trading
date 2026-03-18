import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, Zap, ChartLine, Warehouse, CircleDollarSign, ArrowRight, CreditCard } from 'lucide-angular';

@Component({
  selector: 'app-home',
  imports: [LucideAngularModule, TranslateModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {

  // Icons
  readonly Zap = Zap;
  readonly ChartLine = ChartLine;
  readonly WareHouse = Warehouse;
  readonly CircleDollarSign = CircleDollarSign;
  readonly ArrowRight = ArrowRight;
  readonly CreditCard = CreditCard;
}
