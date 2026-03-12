import { Injectable, signal } from '@angular/core';
import { signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { auth } from '../../infrastructure/firebase.config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  currentUser = signal<User | null>(null);

  async login(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    this.currentUser.set(cred.user);
  }

  async logout() {
    await signOut(auth);
    this.currentUser.set(null);
  }
}