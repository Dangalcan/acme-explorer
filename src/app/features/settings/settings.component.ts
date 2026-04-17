import { Component, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { ACTOR_VALIDATION } from '../../shared/actor.model';
import { FinderService } from '../finder/finder.service';
import { FINDER_VALIDATION } from '../finder/finder.model';

@Component({
  selector: 'app-settings',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private finderService = inject(FinderService);

  readonly validation = ACTOR_VALIDATION;

  email = signal('');
  name = signal('');
  surname = signal('');
  phoneNumber = signal('');
  address = signal('');

  cacheTimeHours = signal(1);
  maxResults = signal(10);

  isSavingFinderPreferences = signal(false);
  finderPreferencesSuccess = signal('');
  finderPreferencesError = signal('');

  isLoading = signal(false);
  isLoadingData = signal(true);
  successMessage = signal('');
  errorMessage = signal('');

  constructor() {
    void this.loadActorData();

    effect(() => {
      const finder = this.finderService.finder();
      this.cacheTimeHours.set(finder.cacheTimeHours);
      this.maxResults.set(finder.maxResults);
    });
  }

  private async loadActorData() {
    const user = this.authService.currentUser();
    if (!user) {
      await this.router.navigateByUrl('/login');
      return;
    }
    this.email.set(user.email ?? '');
    try {
      const data = await this.authService.getActorData();
      if (data) {
        this.name.set(data.name ?? '');
        this.surname.set(data.surname ?? '');
        this.phoneNumber.set(data.phoneNumber ?? '');
        this.address.set(data.address ?? '');
      }
    } finally {
      this.isLoadingData.set(false);
    }
  }

  async save() {
    this.successMessage.set('');
    this.errorMessage.set('');

    if (!this.name().trim()) {
      this.errorMessage.set(this.translate.instant('settings.error.name_required'));
      return;
    }
    if (this.name().trim().length > this.validation.name.maxLength) {
      this.errorMessage.set(
        this.translate.instant('settings.error.name_max', { max: this.validation.name.maxLength }),
      );
      return;
    }
    if (!this.surname().trim()) {
      this.errorMessage.set(this.translate.instant('settings.error.surname_required'));
      return;
    }
    if (this.surname().trim().length > this.validation.surname.maxLength) {
      this.errorMessage.set(
        this.translate.instant('settings.error.surname_max', {
          max: this.validation.surname.maxLength,
        }),
      );
      return;
    }
    if (
      this.phoneNumber().trim() &&
      !this.validation.phoneNumber.pattern.test(this.phoneNumber().trim())
    ) {
      this.errorMessage.set(this.translate.instant('settings.error.phone_invalid'));
      return;
    }
    if (this.address().trim().length > this.validation.address.maxLength) {
      this.errorMessage.set(
        this.translate.instant('settings.error.address_max', {
          max: this.validation.address.maxLength,
        }),
      );
      return;
    }

    this.isLoading.set(true);
    try {
      await this.authService.updateActorProfile({
        name: this.name().trim(),
        surname: this.surname().trim(),
        phoneNumber: this.phoneNumber().trim() || undefined,
        address: this.address().trim() || undefined,
      });
      this.successMessage.set(this.translate.instant('settings.success'));
    } catch {
      this.errorMessage.set(this.translate.instant('settings.error.save_failed'));
    } finally {
      this.isLoading.set(false);
    }
  }

  saveFinderPreferences() {
    this.finderPreferencesSuccess.set('');
    this.finderPreferencesError.set('');

    const cacheTime = Number(this.cacheTimeHours());
    const maxResults = Number(this.maxResults());

    if (
      !Number.isInteger(cacheTime) ||
      cacheTime < FINDER_VALIDATION.cacheTimeHours.min ||
      cacheTime > FINDER_VALIDATION.cacheTimeHours.max
    ) {
      this.finderPreferencesError.set(
        `Cache time must be between ${FINDER_VALIDATION.cacheTimeHours.min} and ${FINDER_VALIDATION.cacheTimeHours.max} hours.`,
      );
      return;
    }

    if (
      !Number.isInteger(maxResults) ||
      maxResults < FINDER_VALIDATION.maxResults.min ||
      maxResults > FINDER_VALIDATION.maxResults.max
    ) {
      this.finderPreferencesError.set(
        `Max results must be between ${FINDER_VALIDATION.maxResults.min} and ${FINDER_VALIDATION.maxResults.max}.`,
      );
      return;
    }

    this.isSavingFinderPreferences.set(true);

    try {
      this.finderService.updateFinder({
        cacheTimeHours: cacheTime,
        maxResults,
      });

      this.finderPreferencesSuccess.set('Finder preferences saved successfully.');
    } catch {
      this.finderPreferencesError.set('Could not save finder preferences.');
    } finally {
      this.isSavingFinderPreferences.set(false);
    }
  }
}
