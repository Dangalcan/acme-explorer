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
      managerId: 'manager-1',
      stages: [
        { title: 'Arrival in Zurich', description: 'Check-in and city tour.', price: 200 },
        { title: 'Grindelwald Hike', description: 'Full-day hike with mountain views.', price: 500 },
        { title: 'Jungfraujoch Summit', description: 'Visit the top of Europe.', price: 500 },
      ],
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
      managerId: 'manager-2',
      stages: [
        { title: 'Arrival in Marrakech', description: 'Welcome dinner and orientation.', price: 150 },
        { title: 'Camel Trek to Erg Chebbi', description: 'Two-day camel ride through the dunes.', price: 500 },
        { title: 'Desert Camp Night', description: 'Overnight camp under the stars.', price: 300 },
      ],
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
      managerId: 'manager-1',
      stages: [
        { title: 'Arrival in Osaka', description: 'Transfer to Kyoto and check-in.', price: 300 },
        { title: 'Fushimi Inari & Arashiyama', description: 'Full-day temple and bamboo grove tour.', price: 600 },
        { title: 'Nishiki Market & Gion', description: 'Street food and geisha district walk.', price: 400 },
        { title: 'Nara Day Trip', description: 'Visit deer park and Todai-ji temple.', price: 500 },
      ],
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
      managerId: 'manager-3',
      stages: [
        { title: 'Arrival in Manaus', description: 'Briefing and gear preparation.', price: 300 },
        { title: 'River Navigation', description: 'Boat trip through Amazon tributaries.', price: 700 },
        { title: 'Jungle Survival Skills', description: 'Guided deep-jungle experience.', price: 800 },
        { title: 'Wildlife Night Walk', description: 'Nocturnal fauna observation.', price: 300 },
      ],
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
