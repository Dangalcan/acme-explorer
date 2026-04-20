import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ACTOR_VALIDATION } from '../../../shared/actor.model';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ComponentCanDeactivate } from '../../../core/guards/pending-changes.guard';

@Component({
  selector: 'app-create-manager',
  imports: [FormsModule, RouterLink, TranslatePipe],
  templateUrl: './create-manager.component.html',
})
export class CreateManagerComponent implements ComponentCanDeactivate {
  private authService = inject(AuthService);
  private translate = inject(TranslateService);

  name = signal('');
  surname = signal('');
  email = signal('');
  phoneNumber = signal('');
  address = signal('');
  password = signal('');
  confirmPassword = signal('');
  errorMessage = signal('');
  successMessage = signal('');
  isShaking = signal(false);
  isLoading = signal(false);

  readonly validation = ACTOR_VALIDATION;

  async createManager() {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.name().trim()) {
      this.errorMessage.set(this.translate.instant('admin.create_manager.error.name_required'));
      this.triggerShake();
      return;
    }

    if (this.name().trim().length > this.validation.name.maxLength) {
      this.errorMessage.set(this.translate.instant('admin.create_manager.error.name_max', { max: this.validation.name.maxLength }));
      this.triggerShake();
      return;
    }

    if (!this.surname().trim()) {
      this.errorMessage.set(this.translate.instant('admin.create_manager.error.surname_required'));
      this.triggerShake();
      return;
    }

    if (this.surname().trim().length > this.validation.surname.maxLength) {
      this.errorMessage.set(this.translate.instant('admin.create_manager.error.surname_max', { max: this.validation.surname.maxLength }));
      this.triggerShake();
      return;
    }

    if (!this.email().trim()) {
      this.errorMessage.set(this.translate.instant('admin.create_manager.error.email_required'));
      this.triggerShake();
      return;
    }

    if (this.phoneNumber().trim() && !this.validation.phoneNumber.pattern.test(this.phoneNumber().trim())) {
      this.errorMessage.set(this.translate.instant('admin.create_manager.error.phone_invalid'));
      this.triggerShake();
      return;
    }

    if (this.address().trim().length > this.validation.address.maxLength) {
      this.errorMessage.set(this.translate.instant('admin.create_manager.error.address_max', { max: this.validation.address.maxLength }));
      this.triggerShake();
      return;
    }

    if (!this.validation.password.pattern.test(this.password())) {
      this.errorMessage.set(this.translate.instant('admin.create_manager.error.password_invalid'));
      this.triggerShake();
      return;
    }

    if (this.password() !== this.confirmPassword()) {
      this.errorMessage.set(this.translate.instant('admin.create_manager.error.passwords_mismatch'));
      this.triggerShake();
      return;
    }

    this.isLoading.set(true);
    try {
      await this.authService.createManager({
        name: this.name().trim(),
        surname: this.surname().trim(),
        email: this.email().trim(),
        phoneNumber: this.phoneNumber().trim() || undefined,
        address: this.address().trim() || undefined,
        password: this.password(),
        role: 'manager',
      });

      this.successMessage.set(this.translate.instant('admin.create_manager.success', { email: this.email().trim() }));
      this.name.set('');
      this.surname.set('');
      this.email.set('');
      this.phoneNumber.set('');
      this.address.set('');
      this.password.set('');
      this.confirmPassword.set('');
    } catch (err: any) {
      console.error(err);
      const FIREBASE_ERROR_KEYS: Record<string, string> = {
        'auth/email-already-in-use': 'admin.create_manager.error.email_in_use',
        'auth/invalid-email':        'admin.create_manager.error.invalid_email',
        'auth/missing-email':        'admin.create_manager.error.email_required',
        'auth/weak-password':        'admin.create_manager.error.weak_password',
        'auth/operation-not-allowed':'admin.create_manager.error.not_allowed',
      };
      const key = FIREBASE_ERROR_KEYS[err?.code] ?? 'admin.create_manager.error.failed';
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
