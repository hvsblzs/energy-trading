import { Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";

@Injectable({ providedIn: 'root'})
export class ErrorService {

  constructor(
    private translate: TranslateService
  ){}

  getErrorMessage(err: any): string{
    const code = err?.error?.error;
    if(!code) return this.translate.instant('errors.GENERIC');
    const translated = this.translate.instant(`errors.${code}`);
    if(translated === `errors.${code}`){
      return this.translate.instant('errors.GENERIC')
    }
    return translated;
  }
}