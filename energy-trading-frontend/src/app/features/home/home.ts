import { Component } from '@angular/core';
import { LucideAngularModule, Zap, ChartLine, Warehouse, CircleDollarSign, ArrowRight, CreditCard } from 'lucide-angular';

@Component({
  selector: 'app-home',
  imports: [LucideAngularModule],
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
