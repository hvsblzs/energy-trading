import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {

    private toasts$ = new BehaviorSubject<Toast[]>([]);
    toasts = this.toasts$.asObservable();
    private counter = 0;

    success(message: string){
        this.add({message, type: 'success'});
    }

    error(message: string){
        this.add({ message, type: 'error'});
    }

    private add(toast: Omit<Toast, 'id'>){
        const id = this.counter++;
        const newToast = {...toast, id};
        this.toasts$.next([...this.toasts$.value, newToast]);
        setTimeout(() => this.remove(id), 5000);
    }

    remove(id: number){
        this.toasts$.next(this.toasts$.value.filter(t => t.id !== id));
    }
}