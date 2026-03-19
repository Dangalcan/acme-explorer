import { Component, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
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

  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  errorMessage = signal('');
  isShaking = signal(false);
  isLoading = signal(false);

  constructor() {
    effect(() => {
      if (this.authService.currentUser()) {
        this.router.navigateByUrl('/');
      }
    });
  }

  async register() {
    this.errorMessage.set('');

    if (this.password() !== this.confirmPassword()) {
      this.errorMessage.set('Passwords do not match');
      this.triggerShake();
      return;
    }

    if (this.password().length < 6) {
      this.errorMessage.set('Password must be at least 6 characters');
      this.triggerShake();
      return;
    }

    this.isLoading.set(true);
    try {
      await this.authService.register(this.email(), this.password());
      await this.router.navigateByUrl('/');
    } catch (err: any) {
      console.error(err);
      const msg = err?.code === 'auth/email-already-in-use'
        ? 'This email is already registered'
        : 'Registration failed. Please try again.';
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
