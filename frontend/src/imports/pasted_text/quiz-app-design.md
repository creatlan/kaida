Create a complete responsive web application interface for an online real-time quiz platform.

The application combines the quiz creation workflow of Google Forms, the interactive real-time quiz experience of Kahoot, and a clean visual style inspired by VK. Do not directly copy any existing interface. Use the interaction patterns as inspiration, but create an original visual system.

The design must be minimalistic, modern, friendly, and easy to use. The primary visual language should resemble VK: white cards, light grey backgrounds, medium blue primary buttons, dark text, rounded corners, subtle shadows, spacious layouts, and simple icons.

The application uses one universal user account. Every user can both participate in quizzes and create their own quizzes.

Create desktop and mobile layouts.

Main colors:
- medium blue primary color similar to VK
- white cards
- very light grey page background
- dark navy or graphite text
- soft green for correct answers
- soft red for incorrect answers
- yellow or orange for bonus points
- light blue for active states

Do not use overly bright or childish colors. The quiz interface may be more dynamic, but it must remain readable and consistent with the VK-inspired design.

Create a reusable design system:
- buttons
- text fields
- dropdowns
- radio buttons
- checkboxes
- cards
- modal windows
- navigation bar
- quiz question cards
- leaderboard rows
- user avatars
- status badges
- tooltips
- empty states
- loading states
- error states

Use a consistent spacing system, typography scale, rounded corners, and component states.

Create the following screens:

1. Login page
- email or username field
- password field
- login button
- link to registration
- password recovery link

2. Registration page
- user name
- email
- password
- confirmation
- registration button

3. Main dashboard
- top navigation with logo, Home, My quizzes, History, Profile
- large section titled “Join a quiz”
- large input for a six-digit room code
- prominent “Join” button
- large “Create a quiz” card with a plus icon
- recent quizzes and recent activity

4. User profile
- avatar
- user name
- unique user ID
- registration date
- quiz participation history
- list of completed quizzes
- quiz title
- date
- score
- maximum possible score
- position in leaderboard
- percentage of correct answers

5. My quizzes page
- quiz cards
- quiz name
- cover image
- number of questions
- status: draft or published
- creation date
- last update
- number of completed attempts
- actions: edit, launch, duplicate, delete
- large button with plus icon to create a new quiz

6. Quiz creation page
The layout should be inspired by Google Forms but visually redesigned.

At the top:
- quiz title
- description
- category
- cover image
- quiz settings
- save status

Show multiple question cards vertically.

Each question card includes:
- question number
- question title field
- optional description
- image upload
- question type selector
- answer options
- correct answer selection
- points field
- time limit field
- duplicate button
- delete button

Supported question types:
- single correct answer
- multiple correct answers
- true or false
- text answer
- question with an image

At the bottom, include a large “Add question” button with a plus icon.

Quiz settings include:
- shuffle questions
- shuffle answers
- keep original order
- use the same points for all questions
- manually define points for every question
- enable or disable speed bonus
- enable or disable bonus for several correct answers in a row
- default question time
- public or private quiz

7. Quiz saved page
- confirmation that the quiz has been saved
- buttons: edit, open quiz, launch quiz
- quiz preview

8. Quiz launch page for the organizer
- large six-digit room code
- QR code
- copy link button
- list of connected participants
- participant count
- start quiz button
- option to remove a participant

9. Participant waiting room
- quiz name
- organizer name
- participant avatar and name
- participant count
- message saying “Waiting for the quiz to start”
- subtle animated loading state

10. Quiz question page
Use a more dynamic but still minimal layout.

Include:
- quiz title
- current question number
- total number of questions
- countdown timer
- current score
- current correct answer streak
- question text
- optional image
- large answer buttons
- submit answer button if needed

Add a question progress panel with numbered cells:
- white: unanswered
- blue: current question
- soft green: correct answer
- soft red: incorrect answer
- grey: skipped

After the user submits an answer, the answer cannot be changed.

11. Answer result page
- large correct or incorrect status
- points received
- bonus received
- current total score
- current leaderboard position
- correct answer
- button or waiting state for the next question

12. Organizer quiz control page
- current question
- countdown timer
- number of users who submitted an answer
- number of users who have not answered
- answer distribution
- live leaderboard
- next question button
- finish quiz button
- automatic or manual question switching

13. Intermediate leaderboard
- top participants
- participant names
- avatars
- current score
- position changes
- highlight the current user

14. Final leaderboard
- podium for first, second, and third place
- full participant ranking
- total points
- number of correct answers
- percentage of correct answers
- maximum answer streak

15. Participant result details
- final score
- leaderboard position
- correct and incorrect answer count
- list of all questions
- user answer
- correct answer
- points received for each question

16. Organizer analytics page
- participant count
- average score
- average percentage of correct answers
- quiz completion rate
- difficult questions
- answer distribution for each question
- final leaderboard
- export results button

Create consistent empty states, loading states, validation states, and error states.

The final design should feel like a real production-ready MVP for an online quiz platform, not only a concept page.