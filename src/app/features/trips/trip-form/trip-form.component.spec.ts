import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AbstractControl, FormGroup } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { TripFormComponent, endAfterStartValidator, startDateInFutureValidator } from './trip-form.component';
import { Trip } from '../trip.model';

// ---------------------------------------------------------------------------
// endAfterStartValidator — pure function, no TestBed needed
// ---------------------------------------------------------------------------
describe('endAfterStartValidator (pure function)', () => {
  function makeGroup(start: string, end: string): AbstractControl {
    const group = new FormGroup({});
    (group as unknown as { controls: Record<string, { value: string }> }).controls = {
      startDate: { value: start },
      endDate: { value: end },
    };
    // Use a real FormGroup via the form builder approach would be ideal,
    // but we can test the validator directly by passing a mock AbstractControl.
    return {
      get: (key: string) => ({ value: key === 'startDate' ? start : end }),
    } as unknown as AbstractControl;
  }

  it('returns null when endDate is after startDate', () => {
    const control = makeGroup('2026-07-01', '2026-07-10');
    expect(endAfterStartValidator(control)).toBeNull();
  });

  it('returns null when endDate equals startDate (single-day trip)', () => {
    const control = makeGroup('2026-07-01', '2026-07-01');
    expect(endAfterStartValidator(control)).toBeNull();
  });

  it('returns { endBeforeStart: true } when endDate is before startDate', () => {
    const control = makeGroup('2026-07-10', '2026-07-01');
    expect(endAfterStartValidator(control)).toEqual({ endBeforeStart: true });
  });

  it('returns null when startDate is absent', () => {
    const control = makeGroup('', '2026-07-10');
    expect(endAfterStartValidator(control)).toBeNull();
  });

  it('returns null when endDate is absent', () => {
    const control = makeGroup('2026-07-01', '');
    expect(endAfterStartValidator(control)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// startDateInFutureValidator — pure function, no TestBed needed
// ---------------------------------------------------------------------------
describe('startDateInFutureValidator (pure function)', () => {
  function makeGroup(start: string): AbstractControl {
    return {
      get: (key: string) => (key === 'startDate' ? { value: start } : null),
    } as unknown as AbstractControl;
  }

  function toInputDate(date: Date): string {
    return date.toISOString().substring(0, 10);
  }

  it('returns null when startDate is absent', () => {
    expect(startDateInFutureValidator(makeGroup(''))).toBeNull();
  });

  it('returns { startDateNotInFuture: true } when startDate is today', () => {
    const today = toInputDate(new Date());
    expect(startDateInFutureValidator(makeGroup(today))).toEqual({ startDateNotInFuture: true });
  });

  it('returns { startDateNotInFuture: true } when startDate is in the past', () => {
    expect(startDateInFutureValidator(makeGroup('2020-01-01'))).toEqual({ startDateNotInFuture: true });
  });

  it('returns null when startDate is tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(startDateInFutureValidator(makeGroup(toInputDate(tomorrow)))).toBeNull();
  });

  it('returns null when startDate is in the future', () => {
    expect(startDateInFutureValidator(makeGroup('2099-12-31'))).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// TripFormComponent
// ---------------------------------------------------------------------------
describe('TripFormComponent', () => {
  let fixture: ComponentFixture<TripFormComponent>;
  let component: TripFormComponent;

  const mockTrip: Trip = {
    id: 'trip-1',
    version: 1,
    ticker: '260413-ABCD',
    title: 'Alps Adventure',
    description: 'A great mountain trip',
    difficultyLevel: 'HARD',
    maxParticipants: 12,
    startDate: new Date('2026-08-01'),
    endDate: new Date('2026-08-10'),
    location: { city: 'Zermatt', country: 'Switzerland' },
    stages: [
      { id: 's1', version: 0, title: 'Arrival', description: 'Arrive and brief', price: 100 },
      { id: 's2', version: 0, title: 'Climb', description: 'Main climb', price: 250 },
    ],
    managerId: 'manager-1',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripFormComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService({ fallbackLang: 'en' }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TripFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // Default form state
  // -------------------------------------------------------------------------
  describe('blank form', () => {
    it('adds one default stage on initialisation', () => {
      expect(component.stagesArray.length).toBe(1);
    });

    it('is invalid when all fields are empty', () => {
      expect(component.tripForm.invalid).toBe(true);
    });

    it('title has required error when blank', () => {
      const ctrl = component.tripForm.get('title')!;
      ctrl.setValue('');
      ctrl.markAsTouched();
      expect(ctrl.hasError('required')).toBe(true);
    });

    it('title has required error when whitespace-only', () => {
      const ctrl = component.tripForm.get('title')!;
      ctrl.setValue('   ');
      ctrl.markAsTouched();
      expect(ctrl.hasError('required')).toBe(true);
    });

    it('title has maxlength error when longer than 100 chars', () => {
      const ctrl = component.tripForm.get('title')!;
      ctrl.setValue('x'.repeat(101));
      expect(ctrl.hasError('maxlength')).toBe(true);
    });

    it('description has required error when blank', () => {
      const ctrl = component.tripForm.get('description')!;
      ctrl.setValue('');
      ctrl.markAsTouched();
      expect(ctrl.hasError('required')).toBe(true);
    });

    it('description has maxlength error when longer than 1000 chars', () => {
      const ctrl = component.tripForm.get('description')!;
      ctrl.setValue('x'.repeat(1001));
      expect(ctrl.hasError('maxlength')).toBe(true);
    });

    it('maxParticipants has min error when value is 0', () => {
      const ctrl = component.tripForm.get('maxParticipants')!;
      ctrl.setValue(0);
      expect(ctrl.hasError('min')).toBe(true);
    });

    it('maxParticipants is valid when value is 1', () => {
      const ctrl = component.tripForm.get('maxParticipants')!;
      ctrl.setValue(1);
      expect(ctrl.valid).toBe(true);
    });

    it('group has endBeforeStart error when end date is before start date', () => {
      component.tripForm.get('startDate')!.setValue('2026-08-10');
      component.tripForm.get('endDate')!.setValue('2026-08-01');
      expect(component.tripForm.hasError('endBeforeStart')).toBe(true);
    });

    it('group has no endBeforeStart error when end date is after start date', () => {
      component.tripForm.get('startDate')!.setValue('2026-08-01');
      component.tripForm.get('endDate')!.setValue('2026-08-10');
      expect(component.tripForm.hasError('endBeforeStart')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Stage management
  // -------------------------------------------------------------------------
  describe('stage management', () => {
    it('addStage() increases stagesArray length by 1', () => {
      const before = component.stagesArray.length;
      component.addStage();
      expect(component.stagesArray.length).toBe(before + 1);
    });

    it('removeStage() decreases length when there are 2+ stages', () => {
      component.addStage(); // now 2 stages
      expect(component.stagesArray.length).toBe(2);
      component.removeStage(1);
      expect(component.stagesArray.length).toBe(1);
    });

    it('removeStage() does NOT remove the last remaining stage', () => {
      expect(component.stagesArray.length).toBe(1);
      component.removeStage(0);
      expect(component.stagesArray.length).toBe(1);
    });

    it('stage price has min error when negative', () => {
      const stageGroup = component.getStageGroup(0);
      stageGroup.get('price')!.setValue(-1);
      expect(stageGroup.get('price')!.hasError('min')).toBe(true);
    });

    it('stage title has required error when blank', () => {
      const stageGroup = component.getStageGroup(0);
      stageGroup.get('title')!.setValue('');
      stageGroup.get('title')!.markAsTouched();
      expect(stageGroup.get('title')!.hasError('required')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Picture management
  // -------------------------------------------------------------------------
  describe('picture management', () => {
    it('addPicture() increases picturesArray length by 1', () => {
      expect(component.picturesArray.length).toBe(0);
      component.addPicture();
      expect(component.picturesArray.length).toBe(1);
    });

    it('removePicture() decreases picturesArray length', () => {
      component.addPicture();
      component.addPicture();
      expect(component.picturesArray.length).toBe(2);
      component.removePicture(0);
      expect(component.picturesArray.length).toBe(1);
    });

    it('picture URL with invalid format produces pattern error', () => {
      component.addPicture();
      const ctrl = component.getPictureControl(0);
      ctrl.setValue('not-a-url');
      expect(ctrl.hasError('pattern')).toBe(true);
    });

    it('picture URL with https:// prefix is valid', () => {
      component.addPicture();
      const ctrl = component.getPictureControl(0);
      ctrl.setValue('https://example.com/image.jpg');
      expect(ctrl.valid).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // submit()
  // -------------------------------------------------------------------------
  describe('submit()', () => {
    it('marks all controls as touched and does not emit when form is invalid', () => {
      const emitted: unknown[] = [];
      component.formSubmit.subscribe((v) => emitted.push(v));

      component.submit();

      expect(component.tripForm.touched).toBe(true);
      expect(emitted.length).toBe(0);
    });

    it('emits trimmed TripFormValue when form is valid', () => {
      const emitted: unknown[] = [];
      component.formSubmit.subscribe((v) => emitted.push(v));

      component.tripForm.get('title')!.setValue('  Alps Adventure  ');
      component.tripForm.get('description')!.setValue('  A great trip  ');
      component.tripForm.get('difficultyLevel')!.setValue('MEDIUM');
      component.tripForm.get('maxParticipants')!.setValue(10);
      component.tripForm.get('startDate')!.setValue('2026-08-01');
      component.tripForm.get('endDate')!.setValue('2026-08-10');
      component.tripForm.get('location')!.get('city')!.setValue('Zermatt');
      component.tripForm.get('location')!.get('country')!.setValue('Switzerland');

      const stageGroup = component.getStageGroup(0);
      stageGroup.get('title')!.setValue('  Stage One  ');
      stageGroup.get('description')!.setValue('  First stage  ');
      stageGroup.get('price')!.setValue(100);

      component.submit();

      expect(emitted.length).toBe(1);
      const value = emitted[0] as { title: string; description: string };
      expect(value.title).toBe('Alps Adventure');
      expect(value.description).toBe('A great trip');
    });

    it('emits correct difficultyLevel', () => {
      const emitted: unknown[] = [];
      component.formSubmit.subscribe((v) => emitted.push(v));

      component.tripForm.get('title')!.setValue('Trip');
      component.tripForm.get('description')!.setValue('Desc');
      component.tripForm.get('difficultyLevel')!.setValue('HARD');
      component.tripForm.get('maxParticipants')!.setValue(5);
      component.tripForm.get('startDate')!.setValue('2026-09-01');
      component.tripForm.get('endDate')!.setValue('2026-09-10');
      const stageGroup = component.getStageGroup(0);
      stageGroup.get('title')!.setValue('Stage');
      stageGroup.get('description')!.setValue('Desc');
      stageGroup.get('price')!.setValue(50);

      component.submit();

      expect((emitted[0] as { difficultyLevel: string }).difficultyLevel).toBe('HARD');
    });
  });

  // -------------------------------------------------------------------------
  // ngOnChanges — pre-fill from existing trip
  // -------------------------------------------------------------------------
  describe('ngOnChanges with existing trip', () => {
    beforeEach(() => {
      component.trip = mockTrip;
      component.ngOnChanges();
      // No detectChanges here — form values are set directly by buildForm()
      // and the outer beforeEach already ran detectChanges once. A second
      // detectChanges after rebuilding the form causes NG0100 due to @for index changes.
    });

    it('pre-fills title', () => {
      expect(component.tripForm.get('title')!.value).toBe('Alps Adventure');
    });

    it('pre-fills description', () => {
      expect(component.tripForm.get('description')!.value).toBe('A great mountain trip');
    });

    it('pre-fills difficultyLevel', () => {
      expect(component.tripForm.get('difficultyLevel')!.value).toBe('HARD');
    });

    it('pre-fills maxParticipants', () => {
      expect(component.tripForm.get('maxParticipants')!.value).toBe(12);
    });

    it('pre-fills stages from trip.stages', () => {
      expect(component.stagesArray.length).toBe(2);
      expect(component.getStageGroup(0).get('title')!.value).toBe('Arrival');
      expect(component.getStageGroup(1).get('title')!.value).toBe('Climb');
    });

    it('pre-fills location city and country', () => {
      expect(component.tripForm.get('location')!.get('city')!.value).toBe('Zermatt');
      expect(component.tripForm.get('location')!.get('country')!.value).toBe('Switzerland');
    });
  });
});
