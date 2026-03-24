import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { type Trip } from '../trip.model';

@Component({
  selector: 'app-trip-display',
  imports: [DatePipe],
  templateUrl: './trip-display.component.html',
  // styleUrl: './trip-display.component.scss',
})
export class TripDisplayComponent {

  trips: Trip[] = [
    {
      id: '1',
      version: 0,
      ticker: 'TRIP-0001',
      title: 'Adventure in the Alps',
      description: 'A breathtaking journey through the Swiss Alps.',
      managerId: 'manager-1',
      stages: [
        { id: 's1', version: 0, title: 'Arrival in Zurich', description: 'Check-in and city tour.', price: 200 },
        { id: 's2', version: 0, title: 'Grindelwald Hike', description: 'Full-day hike with mountain views.', price: 500 },
        { id: 's3', version: 0, title: 'Jungfraujoch Summit', description: 'Visit the top of Europe.', price: 500 },
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
      ticker: 'TRIP-0002',
      title: 'Sahara Desert Trek',
      description: 'Cross the golden dunes of the Moroccan Sahara.',
      managerId: 'manager-2',
      stages: [
        { id: 's4', version: 0, title: 'Arrival in Marrakech', description: 'Welcome dinner and orientation.', price: 150 },
        { id: 's5', version: 0, title: 'Camel Trek to Erg Chebbi', description: 'Two-day camel ride through the dunes.', price: 500 },
        { id: 's6', version: 0, title: 'Desert Camp Night', description: 'Overnight camp under the stars.', price: 300 },
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
      ticker: 'TRIP-0003',
      title: 'Kyoto Cherry Blossom',
      description: 'Discover ancient temples during sakura season.',
      managerId: 'manager-1',
      stages: [
        { id: 's7', version: 0, title: 'Arrival in Osaka', description: 'Transfer to Kyoto and check-in.', price: 300 },
        { id: 's8', version: 0, title: 'Fushimi Inari & Arashiyama', description: 'Full-day temple and bamboo grove tour.', price: 600 },
        { id: 's9', version: 0, title: 'Nishiki Market & Gion', description: 'Street food and geisha district walk.', price: 400 },
        { id: 's10', version: 0, title: 'Nara Day Trip', description: 'Visit deer park and Todai-ji temple.', price: 500 },
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
      ticker: 'TRIP-0004',
      title: 'Amazon Rainforest Expedition',
      description: 'Explore the biodiversity of the Amazon basin.',
      managerId: 'manager-3',
      stages: [
        { id: 's11', version: 0, title: 'Arrival in Manaus', description: 'Briefing and gear preparation.', price: 300 },
        { id: 's12', version: 0, title: 'River Navigation', description: 'Boat trip through Amazon tributaries.', price: 700 },
        { id: 's13', version: 0, title: 'Jungle Survival Skills', description: 'Guided deep-jungle experience.', price: 800 },
        { id: 's14', version: 0, title: 'Wildlife Night Walk', description: 'Nocturnal fauna observation.', price: 300 },
      ],
      location: { city: 'Manaus', country: 'Brazil' },
      difficultyLevel: 'HARD',
      maxParticipants: 10,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-09-14'),
      pictures: [{ url: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=600&q=80' }],
    },
  ];

  readonly difficultyConfig = {
    EASY:   { label: 'Easy',   classes: 'bg-green-100 text-green-700' },
    MEDIUM: { label: 'Medium', classes: 'bg-yellow-100 text-yellow-700' },
    HARD:   { label: 'Hard',   classes: 'bg-red-100 text-red-700' },
  };

  getTotalPrice(trip: Trip): number {
    return trip.totalPrice ?? trip.stages.reduce((sum, s) => sum + s.price, 0);
  }

  getDuration(trip: Trip): number {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  }
}
