import { Injectable } from "@angular/core";
import {Dialog, DialogRef} from '@angular/cdk/dialog';
import {ComponentType} from '@angular/cdk/overlay';
import { Overlay } from "@angular/cdk/overlay";

@Injectable({ providedIn: 'root'})
export class ModalService {
  
  constructor(
    private dialog: Dialog,
    private overlay: Overlay
  ){}

  open<T, D = any, R = any>(component: ComponentType<T>, data?: D): DialogRef<R, T>{
    return this.dialog.open(component, {
      data, 
      panelClass: 'modal-panel',
      backdropClass: 'modal-backdrop',
      minWidth: '360px',
      positionStrategy: this.overlay.position()
      .global()
      .centerHorizontally()
      .centerVertically()
    });
  }
}