import { Component } from '@angular/core';
import { type Trip } from '../trip.model';

@Component({
  selector: 'app-trip-display',
  imports: [],
  templateUrl: './trip-display.component.html',
  styleUrl: './trip-display.component.scss',
})

export class TripDisplayComponent {

  //TODO
  trip: Trip = {
    id: '1',
    version: 0,
    name: 'Berries mix',
  };

  // get comments() {
  // return this.item.comments
  // }

}