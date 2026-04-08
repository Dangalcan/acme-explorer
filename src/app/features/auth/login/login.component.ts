import { Component, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, TranslatePipe],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  email = signal('');
  password = signal('');
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

  async login() {
    this.errorMessage.set('');
    this.isLoading.set(true);

    try {
      await this.authService.login(this.email(), this.password());
      await this.router.navigateByUrl('/');
    } catch (err) {
      console.error(err);
      this.errorMessage.set(this.translate.instant('auth.login.error'));
      this.triggerShake();
    } finally {
      this.isLoading.set(false);
    }
  }

  goBack() {
    this.router.navigateByUrl('/');
  }

  private triggerShake() {
    this.isShaking.set(false);
    setTimeout(() => this.isShaking.set(true), 10);
  }
}
