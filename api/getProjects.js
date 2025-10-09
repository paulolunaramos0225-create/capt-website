// Filename: /api/getProjects.js
// This is a serverless function that will run on a Node.js environment.

// Import the Google APIs client library
const { google } = require('googleapis');

// Define the scope of access needed for the Drive API
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

// A function to authorize our service account
async function authorize() {
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: SCOPES
    });
    const authClient = await auth.getClient();
    return authClient;
}

// The main handler for the serverless function
// Vercel, Netlify, and other platforms will call this function when the endpoint is requested.
module.exports = async (req, res) => {
    try {
        // --- CONFIGURATION ---
        // Get the folder ID from the query parameter (e.g., /api/getProjects?folderId=...)
        const folderId = req.query.folderId;
        if (!folderId) {
            return res.status(400).json({ error: 'Folder ID is required.' });
        }

        // Authorize the service account
        const authClient = await authorize();
        const drive = google.drive({ version: 'v3', auth: authClient });

        // Fetch the list of files from the specified folder
        const fileList = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, webViewLink, thumbnailLink)',
            pageSize: 100 // Adjust as needed
        });

        if (!fileList.data.files || fileList.data.files.length === 0) {
            return res.status(200).json({ title: 'Projects', categories: ['All'], items: [] });
        }

        // --- DATA TRANSFORMATION ---
        // Process the files into the JSON structure your frontend expects
        const items = fileList.data.files.map(file => {
            let category = 'General';
            // Convention: Extract category from filename like "My Video [Long-form].mp4"
            const match = file.name.match(/\[(.*?)\]/);
            if (match && match[1]) {
                category = match[1];
            }

            // Remove the category part for the final title
            const title = file.name.replace(/\[.*?\]/, '').trim();

            return {
                title: title,
                cat: category,
                thumb: file.thumbnailLink,
                drive: file.webViewLink
            };
        });

        // Create a unique list of categories, always including "All"
        const categories = ['All', ...new Set(items.map(item => item.cat))];

        // --- FINAL RESPONSE ---
        // This is the JSON object that will be sent to your frontend
        const responsePayload = {
            title: "Our Work", // You can customize this
            driveFolder: `https://drive.google.com/drive/folders/${folderId}`,
            categories: categories,
            items: items
        };

        // Set cache headers to ensure fresh data is fetched periodically
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
        // Send the successful response
        res.status(200).json(responsePayload);

    } catch (error) {
        console.error('Error fetching from Google Drive API:', error);
        // Send an error response if something goes wrong
        res.status(500).json({ error: 'Failed to retrieve files from Google Drive.' });
    }
};
