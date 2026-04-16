# Acme Explorer

Acme Explorer, Inc. is a company that organises adventurous trips around the world. The goal of this project is to develop a web information system that Acme Explorer, Inc. can use to run their business. This document provides an informal requirement specification. Ask your lecturers for clarifications and details, if necessary. 

# **C-level requirements**

## **Information requirements**

1. ~~The actors of the system are administrators, managers, and explorers.  For every actor, the system must store a name, a surname, an email, an optional phone number, and an optional address.~~ ***DONE***
2. ~~Managers organise trips. For every trip, the system must store a ticker, a title, a description, a price, a location (city and country), a difficulty level (easy, medium, hard), a maximum number of participants, the dates when the trip starts and ends, and an optional collection of pictures. Some trips may be cancelled **if it is done at least one week in advance of its starting date**, in which case the system must store the reason why.~~ ***DONE***
3. ~~Trips are composed of stages. The system must store the following data for each stage: a title, a description, and a price.  The price of a trip is automatically computed building on the price of the individual stages.~~ ***DONE***  
4. ~~Explorers apply for trips. For every application, the system must store the moment when it’s made, a status, and some optional comments by the applicant. When an application is made, the initial status is “PENDING”; later, the corresponding manager can change it to “REJECTED”, which means that the applicant is denied enrolling the trip, in which case the system must record the reason why, or “DUE”, which means that it is awaiting payment. An application with status “DUE” changes automatically to status “ACCEPTED” whenever the corresponding applicant pays the trip.~~ ***DONE***
5. ~~Tickers are generated automatically, must be unique, and cannot be modified by any actor.  They must adhere to the following pattern: “YYMMDD-WWWW”, where “YYMMDD” refers to the current year, month, and day, whereas “WWWW” are four uppercase random letters.~~ ***DONE***

## **Functional requirements**

6. An actor who is not authenticated must be able to:  
   1. ~~Register to the system as an explorer.~~ ***DONE***  
   2. ~~Browse the list of trips and display them.~~ ***DONE***
   3. ~~Search for trips using a single key word that must be contained either in their tickers, titles, or descriptions.~~ ***DONE***  
7. An actor who is authenticated must be able to:  
   1. ~~Do the same as an actor who is not authenticated, except registering to the system.~~ ***DONE***  
   2. ~~Edit his or her personal data.~~ ***DONE***  
8. An actor who is authenticated as a manager must be able to:  
   1. ~~Manage an arbitrary number of trips, which includes creating and listing them, and modifying or deleting them **as long as it is at least 5 days before the starting date, and it does not have any paid applications**.~~ ***DONE***  
   2. ~~Manage the applications for the trips that they manage, which includes listing them and changing their status from “PENDING” to “REJECTED” or “DUE”.~~ ***DONE***
   3. ~~Cancel any trip as long as there is one week left before its starting date. A manager should not be able to cancel a trip if it there is at least one paid application for that trip.~~ ***DONE***  
9. An actor who is authenticated as an explorer must be able to:  
   1. ~~Apply for a trip as long as it has not started yet.~~ ***DONE***  
   2. ~~List the applications that he or she’s made, grouped by status.~~ ***DONE***  
   3. Pay a trip with status “DUE”  
   4. ~~Cancel an application with status “PENDING” or “DUE”. Note that it is not possible to cancel an application that has already been paid.~~ ***DONE***  
10. An actor who is authenticated as an administrator must be able to:
   1. ~~Create accounts for new managers.~~ DONE
   2. Display a dashboard with the following information:  
      * ~~The average, the minimum, the maximum, and the standard deviation of the number of trips managed per manager.~~ ***DONE***  
      * ~~The average, the minimum, the maximum, and the standard deviation of the number of applications per trip.~~ ***DONE***
      * ~~The ratio of applications grouped by status.~~  ***DONE***
      * ~~The number of available seats of the trips that will take place within the current month but have not started yet.~~ ***DONE***  
      * ~~The number of available seats of the trips that will take place within the current month but have not started yet.~~ ***DONE***  
      * ~~The total revenue generated per month in the current year.~~ ***DONE***

## **Non-functional requirements**

11. ~~The system must be available in English and Spanish.  (The data themselves are not required to be available in several languages, only the messages that the system displays.)~~ ***DONE***
12. ~~The list of applications should be rendered in a datatable for managers or in an accordion layout for explorers, and they must be somehow differentiated by their status.~~ ***DONE***
13. ~~Every time the system displays a trip, it should show the number of available places for it. This value is computed as the difference between the maximum number of participants and the number of accepted applications.~~ ***DONE***

# **B-level requirements**

## **Information requirements**

14. Explorers have a finder in which they can specify some search criteria, namely: a single key word, a price range, a date range to search for trips, and/or level of difficulty.  The key word must be contained in the ticker, the title, or the description of the trips returned; the price of the trip should not exceed the price range, if any, must be organised within the date range specified, if any, and according to the level of difficulty indicated, if any. Initially, every search criterion must be null, which means that every trip must be returned.

## **Functional requirements**

15. An actor who is authenticated as an explorer must be able to:  
   1. Manage his or her finder, which includes modifying it and consulting its results, that is, the trips that meet the search criteria. The finder can be persisted in the browser’s local storage.  
   2. Customise the appearance of Acme Explorer to suit their likings, in order to achieve a better UX. Explorers should be able to customize the CSS style (choosing from at least two different styles, light and dark).
16. An actor who is authenticated as an administrator must be able to:  
   1. Display a dashboard with the following information:  
      * The average price range that explorers indicate in their finders.  
      * The top 10 key words that the explorers indicate in their finders.

## **Non-functional requirements**

17. The results of a finder are cached on the users’ browsing device for one hour (by default).  The user should be able to configure that time at will in order to adjust the performance of the system, according to his or her device features.  The minimum time’s one hour and the maximum time’s 24 hours.  
18. The maximum number of results that a finder returns is 10 by default.  The user should be able to change this parameter in order to adjust the performance of the system, according to his or her device features.  The absolute maximum is 50 results.  
19. Trips that start in less than one week should be highlighted in the trip list page, using a distinctive format.  
20. Trip display pages should include a countdown timer that informs the user about the time left for the trip to start (e.g., days, hours and minutes)

# **A-level requirements**

## **Information requirements**

21. ~~The system must allow explorer to create reviews for trips they have participated in. Each review includes a rating between 1 and 5, and an optional textual comment.~~  ***DONE***
22. ~~Explorers rely on favourite lists to keep track of the trips that are more interesting to them. Each favourite list has a name and an optional list of links to their favourite trips.~~ ***DONE***

## **Functional requirements**

23. An actor who is authenticated as an explorer must be able to:  
    1. ~~Manage their favourite list, which includes create, list, update or delete them.~~ ***DONE***
    2. ~~Submit a review for a trip, provided that he or she has an accepted application for that trip and the trip has already finished (only one review per explorer is accepted).~~ ***DONE***  
    3. ~~Filter their favourite lists according to a keyword, so that the system should only display lists that include the keyword in its name.~~ ***DONE***
24. An actor who is authenticated as an administrator must be able to:  
    1. Display a dashboard with the following information:  
       1. ~~The top 5 trips with the highest average rating.~~  ***DONE***
       2. ~~The top 3 trips that have been marked as favourites the most times.~~ ***DONE***  
       3. ~~The number of trips starting within the next 7 days.~~  ***DONE***
       4. ~~The numbers of trips per month of the current year (take into account the month of the starting moment of each trip).~~ ***DONE***

## **Non-functional requirements**

25. ~~The system must compute and display the average rating of each trip whenever the trip details are shown.~~ ***DONE***
26. ~~Whenever an explorer displays his or her favourite lists, the trips that are not available anymore either because they have been expired or cancelled, should been displayed as disabled. If the trip is about to take place, they must be somehow highlighted.~~ ***DONE***  
27. Favourite lists is a prospective feature in Acme Explorer, but it is not clear if it will be finally deployed. Thus, this requirement should be implemented using JSON-server as a mockup back-end server for the time being. This change will not be propagated to the actual back-end until Acme Explorer has tested and the feature approved.  

# **A+ Tasks**

Contact your lecturers to propose an A+ task that your group wish to develop. They should be related to other technologies that are not learnt during the course of the subject and must be related to the deliverable being devised. It is required to include a document explaining your choice and how the task was carried out.

### D01

1. ~~Integrate a modern CSS framework into the project (e.g., Tailwind, Material Design, or Bulma). If this is the choice, it must be kept for every single deliverable.~~ ***DONE***

2. ~~Implement UI animations for the login, register, or master page interactions using Angular’s animation module.~~ ***DONE***

3. Use Angular DevTools or similar tools to analyse component structure, change detection, and routing behaviour, documenting the findings.

### DO2

1. ~~Integrate a third-party API providing weather information, so that when a forthcoming trip is displayed, the application shows the weather forecast for the corresponding location and date.~~ ***DONE***

2. Integrate a third-party API for currency conversion to adapt trip prices according to the
user’s locale.

3. Use the browser’s Geolocation API to obtain the user’s current location and display
nearby trips.

4. Practice debugging and troubleshooting: learn how to identify and resolve issues in an
Angular application using developer tools, Angular CLI commands (e.g., ng serve, ng
build, ng test), and other diagnostic tools.

5. ~~Implement lazy loading to improve application performance by loading modules only when they are required.~~ ***DONE***

6. ~~Use a library to support dynamic language switching at runtime.~~ ***DONE***

### DO3

1. Use a different Maps API component.

2. Implement Virtual Scrolling (a performance improvement over infinite scrolling).

3. Use a third-party library to generate a PDF invoice that users can download once they have paid for a trip.

4. Progressive Web App (PWA) Features: add offline support or push notifications to enhance the user experience.

5. Accessibility improvements: implementing accessibility best practices using Angular's built-in tools and ARIA roles

6. Implement a basic CI/CD workflow and upload a Docker image of the project (previously talked with the teachers)
