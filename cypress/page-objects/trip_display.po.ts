export class TripDisplayPage {

    getEditButton() {
        return cy.get('[data-cy="trip-edit-btn"]');
    }

    getDeleteButton() {
        return cy.get('[data-cy="trip-delete-btn"]');
    }

    getTripTitle() {
        return cy.get('h2').first();
    }

}
