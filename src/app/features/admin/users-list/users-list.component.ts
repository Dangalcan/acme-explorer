import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserRolePipe } from '../../../shared/pipes/user-role.pipe';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../../../infrastructure/firebase.config';
import { AnyActor } from '../../../shared/actor.model';

interface ActorRow {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: AnyActor['role'];
  phoneNumber?: string;
  address?: string;
}

@Component({
  selector: 'app-users-list',
  imports: [RouterLink, UserRolePipe],
  templateUrl: './users-list.component.html',
})
export class UsersListComponent implements OnInit {
  actors = signal<ActorRow[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');

  async ngOnInit() {
    try {
      const snap = await getDocs(collection(db, 'actors'));
      const rows: ActorRow[] = snap.docs.map((d) => {
        const data = d.data() as Partial<AnyActor>;
        return {
          id: d.id,
          name: data.name ?? '',
          surname: data.surname ?? '',
          email: data.email ?? '',
          role: data.role ?? 'explorer',
          phoneNumber: data.phoneNumber,
          address: data.address,
        };
      });
      rows.sort((a, b) => a.role.localeCompare(b.role) || a.email.localeCompare(b.email));
      this.actors.set(rows);
    } catch (err) {
      console.error(err);
      this.errorMessage.set($localize`Failed to load users. Check Firestore permissions.`);
    } finally {
      this.isLoading.set(false);
    }
  }

  readonly roleColors: Record<AnyActor['role'], string> = {
    administrator: 'bg-red-100 text-red-800',
    manager:       'bg-blue-100 text-blue-800',
    explorer:      'bg-green-100 text-green-800',
  };
}
