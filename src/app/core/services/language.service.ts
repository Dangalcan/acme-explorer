import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

const SUPPORTED_LANGS = ['en', 'es'] as const;
type Lang = (typeof SUPPORTED_LANGS)[number];
const STORAGE_KEY = 'lang';
const DEFAULT_LANG: Lang = 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private translate = inject(TranslateService);
  private platformId = inject(PLATFORM_ID);

  init(): void {
    this.translate.addLangs([...SUPPORTED_LANGS]);
    this.translate.setFallbackLang(DEFAULT_LANG);

    let lang: Lang = DEFAULT_LANG;
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved && (SUPPORTED_LANGS as readonly string[]).includes(saved)) {
        lang = saved as Lang;
      }
    }
    this.translate.use(lang);
  }

  switchLanguage(): void {
    const next: Lang = this.currentLang() === 'en' ? 'es' : 'en';
    this.translate.use(next);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, next);
    }
  }

  currentLang(): Lang {
    return (this.translate.currentLang ?? DEFAULT_LANG) as Lang;
  }
}
