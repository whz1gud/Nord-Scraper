# Nord Security YouTube Video Monitor Script

---

## Overview
This script is designed to search for the top 5 YouTube videos related to "Nord Security", store the results in a Google Sheets document, and post the results to a dedicated Slack channel. It's built with Node.js and utilizes the YouTube Data API v3 for video search, Google Sheets API for storing data, and Slack API for notifications.

---

## Features
- Fetches top 5 videos based on view count related to a specified term from YouTube.
- Stores video information in a Google Sheet.
- Posts video information to a specified Slack channel.

---

## Prerequisites
- Node.js installed on your system. Install [here](https://nodejs.org/en/download).
- Access to YouTube Data API, Google Sheets API, and Slack API.
- An `.env` file with your API keys and access tokens.

---

## Dependencies
- `axios`: For making HTTP requests.
- `dotenv`: For loading environment variables.
- `googleapis`: For interacting with Google APIs.
- `readline`: For reading input from the console.

---

## Setup Instructions
### Clone the Repository
```bash
git clone https://your-repository-url.git
cd your-repository-directory
```
---
### Install Dependencies
Open a terminal in the root directory and run:

```bash
npm install
```
---
### Youtube & Google API Setup
Visit the Google Developers Console [here](https://console.cloud.google.com).
- Go to **APIs & Servies** and create a new project.
- Search and enable **YouTube Data API v3** and **Google Sheets API**.
- Create credentials for API key and restrict it to Youtube Data API v3.
- Create OAuth Client ID for **Desktop app**
- Download the **credentials.json** file and place it in the root of your project.

### Slack API Setup
- Create a new workspace in Slack or choose an existing one [here](https://slack.com/). 
- Create a new Slack app [here](https://api.slack.com/).
- Add the chat:write in **Bot Token Scopes** permission under **OAuth & Permissions**.
- Install the app to your existing workspace.
- Note the generated **Bot User OAuth Token** and add it to your `.env` file.

### Google Sheets
- Create a new Google Sheet and note its ID in its URL - `d/{SHEET_ID}/edit`.
- Share the sheet with your service account email.
- Find the **const range in line 104** and set it to your sheet name:
```js
const range = 'Sheet1';
```

### Environment Variables
Create a `.env` file in the root of your project with the following content and fill it in with the actual values:

```bash
YOUTUBE_API_KEY=your_youtube_api_key
GOOGLE_SPREADSHEET_ID=your_google_sheet_id
SLACK_OAUTH_TOKEN=your_slack_oauth_token
SLACK_CHANNEL_ID=your_slack_channel_id
```

---

## Running the Script for 1st time
Open the terminal in root and run:
```bash
node index.js
```

There will be a URL generated to authorize the app in the terminal. Proceed to the link and after that **!important!**:
- Copy the entire code from the address bar. It starts after {`code=` and ends before `&scope=`}. 
- Paste this code back into your console where it says "Enter the code from that page here:". 
- `token.json` file will be generated in your root directory. This will be used for subsequent requests so that you don't have to go through the authentication flow again until the token expires.

---

## Support
For support, contact mielkus.vytautas@gmail.com.