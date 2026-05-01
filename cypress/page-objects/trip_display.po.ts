export class TripDisplayPage {

    getEditButton() {
        return cy.get('[data-cy="trip-edit-btn"]');
    }

    getDeleteButton() {
        return cy.get('[data-cy="trip-delete-btn"]');
    }

    getTripTitle() {
        return cy.get('h1').first();
    }

    getApplyButton() {
        return cy.get('[data-cy="trip-apply-btn"]');
    }

    getApplyCommentTextarea() {
        return cy.get('[data-cy="trip-apply-comment"]');
    }

    getApplyConfirmButton() {
        return cy.get('[data-cy="trip-apply-confirm"]');
    }

}
