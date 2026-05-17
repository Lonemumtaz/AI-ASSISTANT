# StudyMind AI

StudyMind AI is a browser-based student assistant built with HTML, CSS, and JavaScript. It includes login/signup using local storage, chat history, study tools, a focus timer, profile/settings modals, data export/import, and a responsive dashboard for study workflows.

## Features

- Student login and signup stored in browser local storage
- AI-style study chat with saved conversations
- Notes summarizer, quiz generator, homework helper, study planner, coding assistant, flashcards, and focus timer
- Chat search, chat export, and full data backup/restore
- Profile editing and dark mode setting
- Responsive dashboard layout for desktop and mobile screens

## Tech Stack

- HTML5
- CSS3
- JavaScript
- Font Awesome icons
- Google Fonts

## Project Structure

```text
AI-ASSISTANT/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Getting Started

You do not need a backend server for the current version.

1. Clone the repository:

```bash
git clone https://github.com/YOUR-USERNAME/AI-ASSISTANT.git
```

2. Open the project folder:

```bash
cd AI-ASSISTANT
```

3. Open `index.html` in your browser.

You can also use a local development server if you prefer:

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## How To Use

1. Create an account from the signup screen.
2. Log in with the same email and password.
3. Start a chat or choose a study tool from the dashboard.
4. Use settings to export or import your local study data.

## Contributing

Contributions are welcome. Good first improvements include:

- Connecting the chat to a real AI API
- Improving accessibility and keyboard navigation
- Fixing mobile sidebar behavior
- Adding tests for JavaScript helpers
- Improving translations and study tool responses
- Adding screenshots or a live demo link

To contribute:

1. Fork this repository.
2. Create a new branch:

```bash
git checkout -b feature/your-feature-name
```

3. Make your changes.
4. Commit your work:

```bash
git commit -m "Add your feature"
```

5. Push your branch:

```bash
git push origin feature/your-feature-name
```

6. Open a pull request.

## Notes

- This app currently stores user accounts and study data in the browser's local storage.
- It is not using a secure backend authentication system yet.
- Do not use real passwords or sensitive data in the current version.

## License

Add a license before sharing publicly. The MIT License is a simple option if you want others to freely use and contribute to the project.
