export class TripEditPage {

    navigateTo(tripId: string) {
        cy.visit(`localhost:4200/trips/${tripId}/edit`);
    }

    getTitleInput() {
        return cy.get('[data-cy="trip-title-input"]');
    }

    getDescriptionInput() {
        return cy.get('[data-cy="trip-description-input"]');
    }

    getDifficultySelect() {
        return cy.get('[data-cy="trip-difficulty-select"]');
    }

    getMaxParticipants() {
        return cy.get('[data-cy="trip-max-participants-input"]');
    }

    getStartDateInput() {
        return cy.get('[data-cy="trip-start-date-input"]');
    }

    getEndDateInput() {
        return cy.get('[data-cy="trip-end-date-input"]');
    }

    getCityInput() {
        return cy.get('[data-cy="trip-city-input"]');
    }

    getCountryInput() {
        return cy.get('[data-cy="trip-country-input"]');
    }

    getStageTitle(i: number) {
        return cy.get(`[data-cy="trip-stage-title-${i}"]`);
    }

    getStageDescription(i: number) {
        return cy.get(`[data-cy="trip-stage-description-${i}"]`);
    }

    getStagePrice(i: number) {
        return cy.get(`[data-cy="trip-stage-price-${i}"]`);
    }

    getAddStageButton() {
        return cy.get('[data-cy="trip-add-stage-btn"]');
    }

    getRemoveStageButton(i: number) {
        return cy.get(`[data-cy="trip-remove-stage-${i}"]`);
    }

    getSubmitButton() {
        return cy.get('[data-cy="trip-form-submit"]');
    }

    getCancelButton() {
        return cy.get('[data-cy="trip-form-cancel"]');
    }

    submit() {
        this.getSubmitButton().click();
    }

    cancel() {
        this.getCancelButton().click();
    }

}
