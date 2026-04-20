import { Component, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ACTOR_VALIDATION } from '../../../shared/actor.model';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ComponentCanDeactivate } from '../../../core/guards/pending-changes.guard';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, TranslatePipe],
  templateUrl: './register.component.html',
})
export class RegisterComponent implements ComponentCanDeactivate {
  private authService = inject(AuthService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  name = signal('');
  surname = signal('');
  email = signal('');
  phoneNumber = signal('');
  address = signal('');
  password = signal('');
  confirmPassword = signal('');
  errorMessage = signal('');
  isShaking = signal(false);
  isLoading = signal(false);

  readonly validation = ACTOR_VALIDATION;

  constructor() {
    effect(() => {
      if (this.authService.currentUser()) {
        this.router.navigateByUrl('/');
      }
    });
  }

  async register() {
    this.errorMessage.set('');

    if (!this.name().trim()) {
      this.errorMessage.set(this.translate.instant('auth.register.error.name_required'));
      this.triggerShake();
      return;
    }

    if (this.name().trim().length > this.validation.name.maxLength) {
      this.errorMessage.set(this.translate.instant('auth.register.error.name_max', { max: this.validation.name.maxLength }));
      this.triggerShake();
      return;
    }

    if (!this.surname().trim()) {
      this.errorMessage.set(this.translate.instant('auth.register.error.surname_required'));
      this.triggerShake();
      return;
    }

    if (this.surname().trim().length > this.validation.surname.maxLength) {
      this.errorMessage.set(this.translate.instant('auth.register.error.surname_max', { max: this.validation.surname.maxLength }));
      this.triggerShake();
      return;
    }

    if (!this.email().trim()) {
      this.errorMessage.set(this.translate.instant('auth.register.error.email_required'));
      this.triggerShake();
      return;
    }

    if (this.phoneNumber().trim() && !this.validation.phoneNumber.pattern.test(this.phoneNumber().trim())) {
      this.errorMessage.set(this.translate.instant('auth.register.error.phone_invalid'));
      this.triggerShake();
      return;
    }

    if (this.address().trim().length > this.validation.address.maxLength) {
      this.errorMessage.set(this.translate.instant('auth.register.error.address_max', { max: this.validation.address.maxLength }));
      this.triggerShake();
      return;
    }

    if (!this.validation.password.pattern.test(this.password())) {
      this.errorMessage.set(this.translate.instant('auth.register.error.password_invalid'));
      this.triggerShake();
      return;
    }

    if (this.password() !== this.confirmPassword()) {
      this.errorMessage.set(this.translate.instant('auth.register.error.passwords_mismatch'));
      this.triggerShake();
      return;
    }

    this.isLoading.set(true);
    try {
      await this.authService.register({
        name: this.name().trim(),
        surname: this.surname().trim(),
        email: this.email(),
        phoneNumber: this.phoneNumber().trim() || undefined,
        address: this.address().trim() || undefined,
        password: this.password(),
        role: 'explorer',
      });
      await this.router.navigateByUrl('/');
    } catch (err: any) {
      console.error(err);
      const FIREBASE_ERROR_KEYS: Record<string, string> = {
        'auth/email-already-in-use': 'auth.register.error.email_in_use',
        'auth/invalid-email':        'auth.register.error.invalid_email',
        'auth/missing-email':        'auth.register.error.email_required',
        'auth/weak-password':        'auth.register.error.weak_password',
        'auth/operation-not-allowed':'auth.register.error.not_allowed',
      };
      const key = FIREBASE_ERROR_KEYS[err?.code] ?? 'auth.register.error.failed';
      this.errorMessage.set(this.translate.instant(key));
      this.triggerShake();
    } finally {
      this.isLoading.set(false);
    }
  }

  private triggerShake() {
    this.isShaking.set(false);
    setTimeout(() => this.isShaking.set(true), 10);
  }

  canDeactivate(): boolean {
    return !(
      this.name().trim() ||
      this.surname().trim() ||
      this.email().trim() ||
      this.phoneNumber().trim() ||
      this.address().trim() ||
      this.password() ||
      this.confirmPassword()
    );
  }
}
