# AI Live Translator

## Overview
The AI Live Translator is a high-end, real-time voice translation application designed to break down language barriers instantly. It features a simple, elderly-friendly user interface that is intuitive and accessible, avoiding unnecessary complexity.

## Features
- **Real-Time Translation**: Speak natively and receive immediate translations.
- **Top 10 Languages Supported**: Features state-of-the-art Speech-to-Text (STT) and Text-to-Speech (TTS) for the 10 most widely spoken languages globally (including English, Mandarin, Hindi, Spanish, French, Arabic, Bengali, Russian, Portuguese, and Urdu).
- **Elderly-Friendly UI**: A clutter-free, highly readable interface with large buttons, high contrast, and simplified navigation.
- **Local Server**: Easily accessible through a browser running on port `1000`.

## Architecture
The application follows a client-server architecture:
- **Frontend**: A minimal, responsive web interface tailored for ease of use (especially for the elderly). It captures user audio and plays back the translated speech.
- **Backend**: A Node.js server that orchestrates the STT (Speech-to-Text), language translation logic, and TTS (Text-to-Speech) pipelines.
- **Translation Engine**: Integration with an AI-powered translation service and native or external STT/TTS APIs to process the top 10 global languages effectively.

## Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.

### Installation
Clone the repository (if applicable) and navigate into the project directory, then run the following command to install the necessary dependencies:

```bash
npm install
```

### Running the Application
Start the server by running:

```bash
npm start
```

Once the server has started, open your web browser and navigate to:
[http://localhost:1000](http://localhost:1000)

## Usage
1. Open the application in your browser.
2. Select your native language and the target language from the top 10 available options.
3. Tap the large microphone button and start speaking.
4. Listen to the translated output seamlessly played back to you.
