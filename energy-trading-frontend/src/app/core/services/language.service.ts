import { Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";

@Injectable({ providedIn: 'root'})
export class LanguageService {

  constructor(private translate: TranslateService){}

  get currentLang(): string {
    return this.translate.currentLang || this.translate.defaultLang || 'hu';
  }

  toggle(){
    const next = this.currentLang === 'hu' ? 'en' : 'hu';
    this.translate.use(next);
    localStorage.setItem('lang', next);
  }

  init(){
    const saved = localStorage.getItem('lang') ?? 'hu';
    this.translate.use(saved);
  }
}