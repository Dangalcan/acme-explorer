import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {

  private authService = inject(AuthService);

  email = signal('')
  password = signal('')

  async login() {
    try {
      await this.authService.login(this.email(), this.password());
      const user = this.authService.currentUser();
      console.log("Login successfully made! Hi " + user?.email);
    } catch (err) {
      console.error(err);
    }
  }
}