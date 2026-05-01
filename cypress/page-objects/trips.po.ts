export class TripsPage {

    navigateTo() {
        cy.visit('localhost:4200/trips');
    }

    clickFirstTrip() {
        cy.get('[data-cy="trip-card"]').first().click();
    }

}
