// Filename: api/getProjects.js
// FINAL VERSION - Correctly handles Vercel environment variables

const { google } = require('googleapis');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { folderId } = req.query;

  if (!folderId) {
    return res.status(400).json({ error: 'Folder ID is required.' });
  }

  try {
    // --- START OF THE FIX ---
    // Vercel stores the entire JSON key as a string in the environment variable.
    // We need to parse it into a JavaScript object.
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);

    // Authenticate by passing the credentials object directly.
    const auth = new google.auth.GoogleAuth({
      credentials, // Use the parsed credentials object
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    // --- END OF THE FIX ---

    const drive = google.drive({ version: 'v3', auth });

    // Find all subfolders within the main parent folder
    const subfoldersRes = await drive.files.list({
      q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder'`,
      fields: 'files(id, name)',
    });

    const subfolders = subfoldersRes.data.files;
    if (!subfolders || subfolders.length === 0) {
      return res.status(200).json({ title: 'Projects', categories: [], items: [] });
    }

    // For each subfolder, create a promise to fetch its files
    const filePromises = subfolders.map(async (subfolder) => {
      const filesRes = await drive.files.list({
        q: `'${subfolder.id}' in parents and mimeType != 'application/vnd.google-apps.folder'`,
        fields: 'files(id, name, thumbnailLink, webViewLink)',
        orderBy: 'createdTime desc',
        pageSize: 100,
      });

      return filesRes.data.files.map(file => ({
        title: file.name.replace(/\.[^/.]+$/, ''),
        thumb: `https://lh3.googleusercontent.com/d/${file.id}=w1024`,
        drive: file.webViewLink,
        cat: subfolder.name,
      }));
    });

    const nestedItems = await Promise.all(filePromises);
    const items = nestedItems.flat();
    
    const categories = ['All', ...new Set(items.map(item => item.cat))];
    
    const responsePayload = {
      title: 'Our Work',
      driveFolder: `https://drive.google.com/drive/folders/${folderId}`,
      categories: categories,
      items: items,
    };

    res.status(200).json(responsePayload);

  } catch (error) {
    console.error('Error fetching from Google Drive API:', error);
    res.status(500).json({ error: 'Failed to retrieve project files.' });
  }
};