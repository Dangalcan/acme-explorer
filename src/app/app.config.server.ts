import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import enTranslations from '../../public/i18n/en.json';
import esTranslations from '../../public/i18n/es.json';

const translations: Record<string, TranslationObject> = {
  en: enTranslations as unknown as TranslationObject,
  es: esTranslations as unknown as TranslationObject,
};

class ServerTranslateLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<TranslationObject> {
    return of(translations[lang] ?? translations['en']);
  }
}

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    {
      provide: TranslateLoader,
      useClass: ServerTranslateLoader,
    },
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
