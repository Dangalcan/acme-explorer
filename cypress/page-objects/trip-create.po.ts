export class TripCreatePage {

    navigateTo() {
        cy.visit('localhost:4200/trips/create');
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

    /**
     * Fills all required fields and submits the form.
     * After calling this, assert on cy.url() to capture the new trip id.
     */
    fillRequiredFieldsAndSubmit(data: {
        title: string;
        description: string;
        startDate: string;
        endDate: string;
        stageTitle: string;
        stageDescription: string;
        stagePrice: string;
    }) {
        this.getTitleInput().type(data.title);
        this.getDescriptionInput().type(data.description);
        this.getStartDateInput().type(data.startDate);
        this.getEndDateInput().type(data.endDate);
        this.getStageTitle(0).type(data.stageTitle);
        this.getStageDescription(0).type(data.stageDescription);
        this.getStagePrice(0).clear().type(data.stagePrice);
        this.submit();
    }

}
