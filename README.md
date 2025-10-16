EduTra is an all-in-one campus life planner that is meant to help students stay organize and productive. 

This project tackles on the tasks tracking whereby;
- There is a dashboard for displaying weekly activities and budgets of a student.
- A student is able to add tasks for the week or specific time including the time they should be done with it. 
- You are able to change the appearance of the page
- There is also an about page of this life planner.

I used JavaScript, HTML and CSS in this project;
- I used index.html as the main web page of the application.
- Styled the page with CSS (main.css).
- Added a few assets to store the non-static, non-code files, in my case I only added an image.
- I used six javascript scripts to control the applicaion's logic abd behavior.
    1. main.js: This is the starting point of the application, when the page loads, it initializes everything.
    2. search.js: Handles searching and filtering through data. (Finding specific tasks)
    3. state.js: Holds all the current data like the list of events, user preferences, etc.
    4. storage.js: Handles saving and loading data from the user's browser.
    5. ui.js: This one is responsible for what the user sees. It contains functions that update the user interface.
    6. validators.js: This one checkes if the user input is valid eg. ensuring the entered is in the future or the email is formatted correctly.

 - There is also a data file (seed.json) that contains initial data like tasks that the application can load when it starts.
 - Lastly there is a separate HTML file/page (tests.html) that helps run tests for the application's fuctionality, ensuring everything works correctly.     