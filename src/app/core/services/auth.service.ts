import { Injectable, signal } from '@angular/core';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../infrastructure/firebase.config';
import { Explorer } from '../../shared/actor.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  currentUser = signal<User | null>(null);

  constructor() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser.set(user);
    });
  }

  async login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async register(actor: Omit<Explorer, 'id' | 'version'>) {
    const credential = await createUserWithEmailAndPassword(auth, actor.email, actor.password);
    const { password, ...rest } = actor;
    const actorDoc = Object.fromEntries(
      Object.entries({ ...rest, version: 0 }).filter(([, v]) => v !== undefined)
    );
    await setDoc(doc(db, 'actors', credential.user.uid), actorDoc);
  }

  async logout() {
    await signOut(auth);
  }
}
