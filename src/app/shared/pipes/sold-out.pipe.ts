import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'soldOut',
})
export class SoldOutPipe implements PipeTransform {
  transform(availablePlaces: number | null | undefined, maxParticipants?: number | null): string {
    if (availablePlaces === 0) {
      return 'Sold out';
    }

    if (typeof availablePlaces === 'number' && availablePlaces > 0) {
      return `${availablePlaces} spots left`;
    }

    if (typeof maxParticipants === 'number' && maxParticipants > 0) {
      return `${maxParticipants} spots total`;
    }

    return 'Availability unknown';
  }
}
