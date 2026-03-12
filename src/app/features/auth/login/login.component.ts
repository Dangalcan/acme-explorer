import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = signal('');
  password = signal('');
  errorMessage = signal('');

  async login() {
    this.errorMessage.set('');

    try {
      await this.authService.login(this.email(), this.password());
      await this.router.navigateByUrl('/');
    } catch (err) {
      console.error(err);
      this.errorMessage.set('Invalid email or password');
    }
  }
}