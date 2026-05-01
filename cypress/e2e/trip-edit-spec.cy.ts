import { LoginPage } from '../page-objects/login.po';
import { HeaderPage } from '../page-objects/header.po';
import { TripDisplayPage } from '../page-objects/trip_display.po';
import { TripEditPage } from '../page-objects/trip-edit.po';
import { TripCreatePage } from '../page-objects/trip-create.po';

describe('Trip edition', () => {
    const loginPage = new LoginPage();
    const headerPage = new HeaderPage();
    const tripDisplayPage = new TripDisplayPage();
    const tripEditPage = new TripEditPage();
    const tripCreatePage = new TripCreatePage();

    let tripId: string;

    const clearStorage = () => {
        cy.clearAllCookies();
        cy.clearAllLocalStorage();
        cy.clearAllSessionStorage();
        cy.window().then((win) => {
            return win.indexedDB.databases().then((dbs) => {
                dbs.forEach((db) => win.indexedDB.deleteDatabase(db.name!));
            });
        });
    };

    const loginAsManager = () => {
        loginPage.navigateTo();
        cy.wait(500);
        loginPage.fillInLoginFormAsManager();
        headerPage.getLogoutButton().should('be.visible');
    };

    before(() => {
        clearStorage();
        loginAsManager();
        tripCreatePage.navigateTo();
        tripCreatePage.fillRequiredFieldsAndSubmit({
            title: 'E2E Edit Test Trip',
            description: 'Created by Cypress for trip edition tests',
            startDate: '2028-06-01',
            endDate: '2028-07-01',
            stageTitle: 'Stage One',
            stageDescription: 'Stage One description',
            stagePrice: '100',
        });
        cy.url()
            .should('not.include', '/trips/create')
            .should('match', /\/trips\/[^/]+$/)
            .then((url) => {
                tripId = url.split('/trips/')[1];
            });
    });

    after(() => {
        clearStorage();
        loginAsManager();
        cy.then(() => cy.visit(`localhost:4200/trips/${tripId}`));
        tripDisplayPage.getDeleteButton().click();
        cy.url().should('match', /\/trips$/);
    });

    beforeEach(() => {
        cy.intercept('GET', '**/google.firestore.v1.Firestore/Listen/**').as('firestoreListen');
        
        clearStorage();
        loginAsManager();
        tripEditPage.navigateTo(tripId);
        cy.wait(500);
        cy.url().should('include', '/edit');
        
        tripEditPage.getTitleInput().should('not.have.value', '', { timeout: 10000 }); 
        cy.wait(500); 
    });

    it('should display edit form pre-filled with trip data', () => {
        cy.wait(500); 
        tripEditPage.getTitleInput().should('not.have.value', '');
        tripEditPage.getDescriptionInput().should('not.have.value', '');
        tripEditPage.getSubmitButton().should('not.be.disabled');
    });

    it('should successfully save edit and redirect to trip display', () => {
        const newTitle = 'Updated E2E Title ' + Date.now();
        cy.wait(500);
        tripEditPage.getTitleInput()
            .click()
            .type('{selectall}{backspace}')
            .type(newTitle)
            .should('have.value', newTitle);

        tripEditPage.submit();

        cy.url().should('not.include', '/edit');
        cy.url().should('include', `/trips/${tripId}`);
        cy.reload();
        cy.get('h1', { timeout: 10000 }).should('have.text', newTitle);
    });

    it('should cancel edit and return to trip display page', () => {
        tripEditPage.cancel();
        cy.url().should('not.include', '/edit');
        cy.url().should('include', '/trips/');
    });

    it('should show validation error when title is blank', () => {
        cy.wait(500); 
        tripEditPage.getTitleInput().click().type('{selectall}{backspace}');
        tripEditPage.submit();
        tripEditPage.getTitleInput().should('have.class', 'border-red-500');
        cy.url().should('include', '/edit');
    });

    it('should show validation error for past start date', () => {
        cy.wait(500);
        tripEditPage.getStartDateInput().clear().type('2020-01-01');
        tripEditPage.submit();
        tripEditPage.getStartDateInput().should('have.class', 'border-red-500');
        cy.url().should('include', '/edit');
    });

    it('should show validation error when end date is before start date', () => {
        cy.wait(500);
        tripEditPage.getStartDateInput().clear().type('2030-06-01');
        tripEditPage.getEndDateInput().clear().type('2030-05-01');
        tripEditPage.submit();
        tripEditPage.getEndDateInput().should('have.class', 'border-red-500');
        cy.url().should('include', '/edit');
    });

    it('should successfully change difficulty level', () => {
        cy.wait(500);
        tripEditPage.getDifficultySelect().select('HARD');
        tripEditPage.submit();
        cy.url().should('not.include', '/edit');
        cy.url().should('include', '/trips/');
    });
});