require('dotenv').config();
const axios = require('axios');
const { google } = require('googleapis');
const { readFileSync, writeFileSync } = require('fs');
const readline = require('readline');

// Required environment variables
const API_KEY = process.env.YOUTUBE_API_KEY;
const SEARCH_TERM = 'Nord Security';
const MAX_RESULTS = 5;
const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
const SLACK_OAUTH_TOKEN = process.env.SLACK_OAUTH_TOKEN;
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID

// Load client secrets from a local credentials.json file
const credentials = JSON.parse(readFileSync('credentials.json'));
const { client_secret, client_id, redirect_uris } = credentials.installed;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

/**
 * The main function of the script.
 * It runs the YouTube data fetch, updates Google Spreadsheet 
 * and posts the message to Slack channel.
 */
async function main() {
    let token;
    try {
        token = JSON.parse(readFileSync('token.json'));
        oAuth2Client.setCredentials(token);
        
        // Access the spreadsheet and get the list of videos to be sent to Slack
        const videosList = await accessSpreadsheet(oAuth2Client);

        const messageIntro = 'The top 5 NordSecurity YouTube videos:\n';
        const messageBody = videosList.join('\n');
        const fullMessage = messageIntro + messageBody;
        
        await postMessageToSlack(SLACK_OAUTH_TOKEN, SLACK_CHANNEL_ID, fullMessage);

    } catch (error) {
        console.error('An error occurred:', error);
        getNewToken(oAuth2Client, accessSpreadsheet);
    }
}

/**
 * Retrieves a new token for the Google Sheets API.
 * @param {google.auth.OAuth2} oAuth2Client - The OAuth2 client to get token for.
 * @param {Function} callback - The callback function to execute with the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    console.log('Authorize this app by visiting this URL:', authUrl);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('Enter the code from address page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            writeFileSync('token.json', JSON.stringify(token));
            callback(oAuth2Client);
        });
    });
}

/**
 * Accesses and updates the Google Spreadsheet +and retrieves YouTube video information.
 * @param {google.auth.OAuth2} client - The OAuth2 client to use for accessing the Sheets API.
 * @returns {Promise<string[]>} - A promise that resolves to an array of video messages.
 */
async function accessSpreadsheet(client) {
    const sheets = google.sheets({ version: 'v4', auth: client });

    // Fetch the top 5 videos from YouTube
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
            part: 'snippet',
            q: SEARCH_TERM,
            maxResults: MAX_RESULTS,
            type: 'video',
            key: API_KEY,
        },
    });

    const videoIds = response.data.items.map((item) => item.id.videoId).join(',');

    const videosResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
            part: 'snippet,statistics',
            id: videoIds,
            key: API_KEY,
        },
    });

    const videosSortedByViews = videosResponse.data.items.sort((a, b) => b.statistics.viewCount - a.statistics.viewCount);

    // Create headers and video data array
    const headers = [['Video Name', 'Views']];
    const videoData = videosSortedByViews.map((video, index) => {
        console.log(`${index + 1}. ${video.snippet.title} - ${video.statistics.viewCount} views`);
        return [video.snippet.title, video.statistics.viewCount.toString()];
    });

    const values = headers.concat(videoData);

    // !Change this according to your sheet name!
    const range = 'Sheet1';

    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            resource: { values },
        });
        console.log('Sheet successfully updated.');
    } catch (err) {
        console.error('Error updating sheet:', err);
        return [];
    }

    const messages = videoData.map((video, index) => {
        return `${index + 1}. ${video[0]} - ${video[1]} views`;
    });

    return messages;
}

/**
 * Posts a message to a specified Slack channel.
 * @param {string} token - The OAuth token for Slack.
 * @param {string} channel - The channel ID to post the message to.
 * @param {string} message - The message to post.
 */
async function postMessageToSlack(token, channel, message) {
    try {
        const result = await axios.post('https://slack.com/api/chat.postMessage', {
            channel: channel,
            text: message
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (result.data.ok) {
            console.log('Message posted to Slack successfully.');
        } else {
            console.log('Failed to post message to Slack:', result.data.error);
        }
    } catch (error) {
        console.error('Error posting message to Slack:', error.response.data);
    }
}

// Script start
main().catch(console.error);