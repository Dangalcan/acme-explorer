import { Component, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ACTOR_VALIDATION } from '../../../shared/actor.model';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

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
      this.errorMessage.set('Name is required');
      this.triggerShake();
      return;
    }

    if (this.name().trim().length > this.validation.name.maxLength) {
      this.errorMessage.set(`Name must be at most ${this.validation.name.maxLength} characters`);
      this.triggerShake();
      return;
    }

    if (!this.surname().trim()) {
      this.errorMessage.set('Surname is required');
      this.triggerShake();
      return;
    }

    if (this.surname().trim().length > this.validation.surname.maxLength) {
      this.errorMessage.set(`Surname must be at most ${this.validation.surname.maxLength} characters`);
      this.triggerShake();
      return;
    }

    if (!this.email().trim()) {
      this.errorMessage.set('Email is required');
      this.triggerShake();
      return;
    }

    if (this.phoneNumber().trim() && !this.validation.phoneNumber.pattern.test(this.phoneNumber().trim())) {
      this.errorMessage.set('Invalid phone number format');
      this.triggerShake();
      return;
    }

    if (this.address().trim().length > this.validation.address.maxLength) {
      this.errorMessage.set(`Address must be at most ${this.validation.address.maxLength} characters`);
      this.triggerShake();
      return;
    }

    if (!this.validation.password.pattern.test(this.password())) {
      this.errorMessage.set('Password must be at least 8 characters and include uppercase, lowercase, number, and special character (@$!%*?&)');
      this.triggerShake();
      return;
    }

    if (this.password() !== this.confirmPassword()) {
      this.errorMessage.set('Passwords do not match');
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
      const FIREBASE_ERRORS: Record<string, string> = {
        'auth/email-already-in-use': 'This email is already registered',
        'auth/invalid-email':        'Invalid email address',
        'auth/missing-email':        'Email is required',
        'auth/weak-password':        'Password is too weak',
        'auth/operation-not-allowed':'Email/password registration is not enabled',
      };
      const msg = FIREBASE_ERRORS[err?.code] ?? 'Registration failed. Please try again.';
      this.errorMessage.set(msg);
      this.triggerShake();
    } finally {
      this.isLoading.set(false);
    }
  }

  private triggerShake() {
    this.isShaking.set(false);
    setTimeout(() => this.isShaking.set(true), 10);
  }
}
