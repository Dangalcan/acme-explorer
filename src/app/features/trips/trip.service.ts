import { Injectable, signal } from '@angular/core';
import { Trip } from './trip.model';

@Injectable({ providedIn: 'root' })
export class TripService {

  trips = signal<Trip[]>([
    {
      id: '1',
      version: 0,
      ticker: '260601-ALPS',
      title: 'Adventure in the Alps',
      description: 'A breathtaking journey through the Swiss Alps, featuring glaciers, mountain huts, and traditional Swiss culture. Suitable for intermediate hikers looking for a multi-day alpine experience.',
      managerId: 'manager-1',
      stages: [
        { id: 's1', version: 0, title: 'Arrival in Zurich', description: 'Check-in and city tour along the Limmat river.', price: 200 },
        { id: 's2', version: 0, title: 'Grindelwald Hike', description: 'Full-day hike with panoramic views of the Eiger north face.', price: 500 },
        { id: 's3', version: 0, title: 'Jungfraujoch Summit', description: 'Visit the top of Europe at 3,454 m by cogwheel railway.', price: 500 },
      ],
      location: { city: 'Zurich', country: 'Switzerland' },
      difficultyLevel: 'MEDIUM',
      maxParticipants: 20,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-10'),
      pictures: [{ url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80' }],
    },
    {
      id: '2',
      version: 0,
      ticker: '260715-SAHRA',
      title: 'Sahara Desert Trek',
      description: 'Cross the golden dunes of the Moroccan Sahara on camelback, sleeping under a canopy of stars in a traditional Berber camp. A truly life-changing desert experience.',
      managerId: 'manager-2',
      stages: [
        { id: 's4', version: 0, title: 'Arrival in Marrakech', description: 'Welcome dinner and orientation at a riad in the medina.', price: 150 },
        { id: 's5', version: 0, title: 'Camel Trek to Erg Chebbi', description: 'Two-day camel ride through the high dunes of Erg Chebbi.', price: 500 },
        { id: 's6', version: 0, title: 'Desert Camp Night', description: 'Overnight luxury camp under the stars with traditional music.', price: 300 },
      ],
      location: { city: 'Merzouga', country: 'Morocco' },
      difficultyLevel: 'HARD',
      maxParticipants: 12,
      startDate: new Date('2026-07-15'),
      endDate: new Date('2026-07-22'),
      pictures: [{ url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&q=80' }],
    },
    {
      id: '3',
      version: 0,
      ticker: '260328-KYOT',
      title: 'Kyoto Cherry Blossom',
      description: 'Discover ancient temples, bamboo groves and imperial gardens during sakura season. Walk through thousands of torii gates at Fushimi Inari and witness the geisha tradition in Gion.',
      managerId: 'manager-1',
      stages: [
        { id: 's7', version: 0, title: 'Arrival in Osaka', description: 'Transfer to Kyoto and check-in at a traditional ryokan.', price: 300 },
        { id: 's8', version: 0, title: 'Fushimi Inari & Arashiyama', description: 'Full-day temple and bamboo grove tour with a tea ceremony.', price: 600 },
        { id: 's9', version: 0, title: 'Nishiki Market & Gion', description: 'Street food tasting and guided geisha district walk at dusk.', price: 400 },
        { id: 's10', version: 0, title: 'Nara Day Trip', description: 'Visit deer park and Todai-ji temple housing the giant Buddha.', price: 500 },
      ],
      location: { city: 'Kyoto', country: 'Japan' },
      difficultyLevel: 'EASY',
      maxParticipants: 25,
      startDate: new Date('2026-03-28'),
      endDate: new Date('2026-04-05'),
      pictures: [{ url: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80' }],
    },
    {
      id: '4',
      version: 0,
      ticker: '260901-AMZN',
      title: 'Amazon Rainforest Expedition',
      description: 'Explore the unparalleled biodiversity of the Amazon basin with expert naturalist guides. Navigate black-water rivers, learn jungle survival skills, and observe nocturnal wildlife in their natural habitat.',
      managerId: 'manager-3',
      stages: [
        { id: 's11', version: 0, title: 'Arrival in Manaus', description: 'Briefing session and gear preparation at base camp.', price: 300 },
        { id: 's12', version: 0, title: 'River Navigation', description: 'Multi-day boat trip through Amazon tributaries spotting pink dolphins.', price: 700 },
        { id: 's13', version: 0, title: 'Jungle Survival Skills', description: 'Guided deep-jungle experience: shelter building and foraging.', price: 800 },
        { id: 's14', version: 0, title: 'Wildlife Night Walk', description: 'Nocturnal fauna observation with headlamps and expert guide.', price: 300 },
      ],
      location: { city: 'Manaus', country: 'Brazil' },
      difficultyLevel: 'HARD',
      maxParticipants: 10,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-09-14'),
      pictures: [{ url: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=600&q=80' }],
    },
  ]);

  getById(id: string): Trip | undefined {
    return this.trips().find(t => t.id === id);
  }

  cancelTrip(tripId: string): void {
    this.trips.update(trips =>
      trips.map(t =>
        t.id === tripId
          ? { ...t, cancellation: { reason: 'Cancelled by manager', cancelledAt: new Date() } }
          : t
      )
    );
  }
}
