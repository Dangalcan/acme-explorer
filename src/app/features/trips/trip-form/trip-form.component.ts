import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import {
  DifficultyLevel,
  STAGE_VALIDATION,
  TRIP_LOCATION_VALIDATION,
  TRIP_VALIDATION,
  Stage,
  Trip,
} from '../trip.model';

export const endAfterStartValidator: ValidatorFn = (group: AbstractControl) => {
  const start = group.get('startDate')?.value as string;
  const end = group.get('endDate')?.value as string;
  if (!start || !end) return null;
  return new Date(end) > new Date(start) ? null : { endBeforeStart: true };
};

function toInputDate(date: Date): string {
  return new Date(date).toISOString().substring(0, 10);
}

export interface TripFormValue {
  title: string;
  description: string;
  difficultyLevel: DifficultyLevel;
  maxParticipants: number;
  startDate: Date;
  endDate: Date;
  location: { city: string; country: string };
  stages: { title: string; description: string; price: number }[];
  pictures: string[];
}

@Component({
  selector: 'app-trip-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './trip-form.component.html',
})
export class TripFormComponent implements OnChanges {
  @Input() trip: Trip | null = null;
  @Input() isLoading = false;
  @Output() formSubmit = new EventEmitter<TripFormValue>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  readonly validation = TRIP_VALIDATION;
  readonly stageValidation = STAGE_VALIDATION;
  readonly locationValidation = TRIP_LOCATION_VALIDATION;
  readonly difficultyLevels: DifficultyLevel[] = ['EASY', 'MEDIUM', 'HARD'];

  tripForm = this.buildForm();

  get stagesArray(): FormArray {
    return this.tripForm.get('stages') as FormArray;
  }

  get picturesArray(): FormArray {
    return this.tripForm.get('pictures') as FormArray;
  }

  ngOnChanges(): void {
    if (this.trip) {
      this.tripForm = this.buildForm(this.trip);
    }
  }

  private buildForm(trip?: Trip): FormGroup {
    const stages = trip?.stages ?? [];
    const pictures = trip?.pictures ?? [];

    const form = this.fb.group(
      {
        title: [
          trip?.title ?? '',
          [Validators.required, Validators.maxLength(TRIP_VALIDATION.title.maxLength)],
        ],
        description: [
          trip?.description ?? '',
          [Validators.required, Validators.maxLength(TRIP_VALIDATION.description.maxLength)],
        ],
        difficultyLevel: [trip?.difficultyLevel ?? ('EASY' as DifficultyLevel), Validators.required],
        maxParticipants: [
          trip?.maxParticipants ?? 1,
          [Validators.required, Validators.min(TRIP_VALIDATION.maxParticipants.min)],
        ],
        startDate: [trip ? toInputDate(trip.startDate) : '', Validators.required],
        endDate: [trip ? toInputDate(trip.endDate) : '', Validators.required],
        location: this.fb.group({
          city: [
            trip?.location?.city ?? '',
            Validators.maxLength(TRIP_LOCATION_VALIDATION.city.maxLength),
          ],
          country: [
            trip?.location?.country ?? '',
            Validators.maxLength(TRIP_LOCATION_VALIDATION.country.maxLength),
          ],
        }),
        stages: this.fb.array(
          stages.map((s) => this.createStageGroup(s)),
          Validators.minLength(TRIP_VALIDATION.stages.minLength),
        ),
        pictures: this.fb.array(
          pictures.map((p) =>
            this.fb.control(p.url, Validators.pattern(/^https?:\/\/.+/)),
          ),
        ),
      },
      { validators: endAfterStartValidator },
    );

    if (!trip) {
      this.addStage(form.get('stages') as FormArray);
    }

    return form;
  }

  createStageGroup(stage?: Partial<Stage>): FormGroup {
    return this.fb.group({
      title: [
        stage?.title ?? '',
        [Validators.required, Validators.maxLength(STAGE_VALIDATION.title.maxLength)],
      ],
      description: [
        stage?.description ?? '',
        [Validators.required, Validators.maxLength(STAGE_VALIDATION.description.maxLength)],
      ],
      price: [
        stage?.price ?? 0,
        [Validators.required, Validators.min(STAGE_VALIDATION.price.min)],
      ],
    });
  }

  addStage(arr: FormArray = this.stagesArray): void {
    arr.push(this.createStageGroup());
  }

  removeStage(index: number): void {
    if (this.stagesArray.length > 1) {
      this.stagesArray.removeAt(index);
    }
  }

  addPicture(): void {
    this.picturesArray.push(
      this.fb.control('', Validators.pattern(/^https?:\/\/.+/)) as FormControl,
    );
  }

  removePicture(index: number): void {
    this.picturesArray.removeAt(index);
  }

  getStageGroup(index: number): FormGroup {
    return this.stagesArray.at(index) as FormGroup;
  }

  getPictureControl(index: number): FormControl {
    return this.picturesArray.at(index) as FormControl;
  }

  submit(): void {
    if (this.tripForm.invalid) {
      this.tripForm.markAllAsTouched();
      return;
    }

    const raw = this.tripForm.getRawValue();

    this.formSubmit.emit({
      title: raw['title'] as string,
      description: raw['description'] as string,
      difficultyLevel: raw['difficultyLevel'] as DifficultyLevel,
      maxParticipants: Number(raw['maxParticipants']),
      startDate: new Date(raw['startDate'] as string),
      endDate: new Date(raw['endDate'] as string),
      location: raw['location'] as { city: string; country: string },
      stages: raw['stages'] as { title: string; description: string; price: number }[],
      pictures: ((raw['pictures'] as string[]) ?? []).filter((url) => url?.trim()),
    });
  }
}
