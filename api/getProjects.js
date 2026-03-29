// Filename: api/getProjects.js
// FINAL VERSION - Correctly handles Vercel environment variables

const { google } = require('googleapis');
const fs = require('fs');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { folderId } = req.query;

  if (!folderId) {
    return res.status(400).json({ error: 'Folder ID is required.' });
  }

  try {
    const rawCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS_PATH;

    let credentials = null;
    if (rawCredentials && rawCredentials !== 'undefined' && rawCredentials !== 'null') {
      credentials = JSON.parse(rawCredentials);
    } else if (credentialsPath) {
      const fileContents = fs.readFileSync(credentialsPath, 'utf8');
      credentials = JSON.parse(fileContents);
    } else {
      return res.status(500).json({
        error: 'Missing Google credentials. Set GOOGLE_APPLICATION_CREDENTIALS (JSON string) or GOOGLE_APPLICATION_CREDENTIALS_PATH (file path).'
      });
    }

    // Authenticate by passing the credentials object directly.
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Find all subfolders within the main parent folder
    const subfoldersRes = await drive.files.list({
      q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder'`,
      fields: 'files(id, name)',
    });

    const subfolders = subfoldersRes.data.files;
    if (!subfolders || subfolders.length === 0) {
      const filesRes = await drive.files.list({
        q: `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder'`,
        fields: 'files(id, name, thumbnailLink, webViewLink)',
        orderBy: 'createdTime desc',
        pageSize: 200,
      });

      const items = (filesRes.data.files || []).map(file => ({
        title: file.name.replace(/\.[^/.]+$/, ''),
        thumb: `https://lh3.googleusercontent.com/d/${file.id}=w1024`,
        drive: file.webViewLink,
        cat: 'All',
      }));

      return res.status(200).json({
        title: 'Projects',
        driveFolder: `https://drive.google.com/drive/folders/${folderId}`,
        categories: ['All'],
        items,
      });
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
