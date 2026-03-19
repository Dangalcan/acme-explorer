import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { type Trip } from '../trip.model';

@Component({
  selector: 'app-trip-display',
  imports: [DatePipe],
  templateUrl: './trip-display.component.html',
  styleUrl: './trip-display.component.scss',
})
export class TripDisplayComponent {

  trips: Trip[] = [
    {
      id: '1',
      version: 0,
      ticker: 'TRIP-0001',
      title: 'Adventure in the Alps',
      description: 'A breathtaking journey through the Swiss Alps.',
      price: 1200,
      location: { city: 'Zurich', country: 'Switzerland' },
      difficulty: 'medium',
      maxParticipants: 20,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-10'),
      pictures: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80'],
    },
    {
      id: '2',
      version: 0,
      ticker: 'TRIP-0002',
      title: 'Sahara Desert Trek',
      description: 'Cross the golden dunes of the Moroccan Sahara.',
      price: 950,
      location: { city: 'Merzouga', country: 'Morocco' },
      difficulty: 'hard',
      maxParticipants: 12,
      startDate: new Date('2026-07-15'),
      endDate: new Date('2026-07-22'),
      pictures: ['https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&q=80'],
    },
    {
      id: '3',
      version: 0,
      ticker: 'TRIP-0003',
      title: 'Kyoto Cherry Blossom',
      description: 'Discover ancient temples during sakura season.',
      price: 1800,
      location: { city: 'Kyoto', country: 'Japan' },
      difficulty: 'easy',
      maxParticipants: 25,
      startDate: new Date('2026-03-28'),
      endDate: new Date('2026-04-05'),
      pictures: ['https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80'],
    },
    {
      id: '4',
      version: 0,
      ticker: 'TRIP-0004',
      title: 'Amazon Rainforest Expedition',
      description: 'Explore the biodiversity of the Amazon basin.',
      price: 2100,
      location: { city: 'Manaus', country: 'Brazil' },
      difficulty: 'hard',
      maxParticipants: 10,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-09-14'),
      pictures: ['https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=600&q=80'],
    },
  ];

  readonly difficultyConfig = {
    easy:   { label: 'Easy',   classes: 'bg-green-100 text-green-700' },
    medium: { label: 'Medium', classes: 'bg-yellow-100 text-yellow-700' },
    hard:   { label: 'Hard',   classes: 'bg-red-100 text-red-700' },
  };

  getDuration(trip: Trip): number {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  }
}
