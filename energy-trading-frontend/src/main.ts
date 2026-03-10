import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComonent } from './app/app';

bootstrapApplication(AppComonent, appConfig)
  .catch((err) => console.error(err));
