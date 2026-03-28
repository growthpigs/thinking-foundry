/**
 * Google Drive Manager
 *
 * Creates folder structure in Google Drive using a service account.
 * The service account approach avoids user OAuth flows — simpler for POC.
 *
 * Setup:
 * 1. Create a service account in Google Cloud Console
 * 2. Enable Google Drive API
 * 3. Download JSON key file
 * 4. Set GOOGLE_SERVICE_ACCOUNT env var to the path
 *
 * The service account creates folders in its own Drive space,
 * then shares them with the user's email so they appear in "Shared with me".
 */

const { google } = require('googleapis');
const fs = require('fs');

class DriveManager {
  constructor() {
    this.drive = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    const saPath = process.env.GOOGLE_SERVICE_ACCOUNT;
    if (!saPath) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT not configured');
    }

    if (!fs.existsSync(saPath)) {
      throw new Error(`Service account file not found: ${saPath}`);
    }

    const keyFile = JSON.parse(fs.readFileSync(saPath, 'utf-8'));

    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ['https://www.googleapis.com/auth/drive']
    });

    this.drive = google.drive({ version: 'v3', auth });
    this.initialized = true;
    console.log('[DRIVE] Initialized with service account');
  }

  /**
   * Find or create the root "Thinking Foundry Sessions" folder
   */
  async getOrCreateRootFolder() {
    await this.init();

    const rootName = 'Thinking Foundry Sessions';

    // Search for existing folder
    const res = await this.drive.files.list({
      q: `name='${rootName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    if (res.data.files.length > 0) {
      console.log(`[DRIVE] Found existing root folder: ${res.data.files[0].id}`);
      return res.data.files[0].id;
    }

    // Create root folder
    const folder = await this.drive.files.create({
      requestBody: {
        name: rootName,
        mimeType: 'application/vnd.google-apps.folder'
      },
      fields: 'id'
    });

    console.log(`[DRIVE] Created root folder: ${folder.data.id}`);
    return folder.data.id;
  }

  /**
   * Create session folder structure:
   *   Thinking Foundry Sessions/
   *   └── [Session Name] - [Date]/
   *       ├── MINE/phase-output.md
   *       ├── SCOUT/phase-output.md
   *       └── ... etc
   */
  async createSessionFolder(sessionName, userEmail, phaseOutputs) {
    await this.init();

    const rootId = await this.getOrCreateRootFolder();
    const dateStr = new Date().toISOString().split('T')[0];
    const sessionFolderName = `${sessionName} - ${dateStr}`;

    // Create session folder
    const sessionFolder = await this.drive.files.create({
      requestBody: {
        name: sessionFolderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [rootId]
      },
      fields: 'id, webViewLink'
    });

    const sessionFolderId = sessionFolder.data.id;
    console.log(`[DRIVE] Created session folder: ${sessionFolderName} (${sessionFolderId})`);

    // Create phase subfolders and files
    const phaseNames = {
      1: 'MINE', 2: 'SCOUT', 3: 'ASSAY', 4: 'CRUCIBLE',
      5: 'AUDITOR', 6: 'PLAN', 7: 'VERIFY'
    };

    for (const [phaseNum, phaseName] of Object.entries(phaseNames)) {
      // Create phase subfolder
      const phaseFolder = await this.drive.files.create({
        requestBody: {
          name: phaseName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [sessionFolderId]
        },
        fields: 'id'
      });

      // Create phase output file if we have content
      const output = phaseOutputs && phaseOutputs[phaseNum];
      if (output) {
        const content = typeof output === 'string' ? output : output.output || '';
        await this.drive.files.create({
          requestBody: {
            name: 'phase-output.md',
            mimeType: 'text/markdown',
            parents: [phaseFolder.data.id]
          },
          media: {
            mimeType: 'text/markdown',
            body: `# ${phaseName} Output\n\n${content}`
          },
          fields: 'id'
        });
        console.log(`[DRIVE] Created ${phaseName}/phase-output.md`);
      }
    }

    // Share with user if email provided
    if (userEmail) {
      try {
        await this.drive.permissions.create({
          fileId: sessionFolderId,
          requestBody: {
            role: 'writer',
            type: 'user',
            emailAddress: userEmail
          },
          sendNotificationEmail: true
        });
        console.log(`[DRIVE] Shared folder with ${userEmail}`);
      } catch (err) {
        console.warn(`[DRIVE] Could not share with ${userEmail}: ${err.message}`);
      }
    }

    return {
      folderId: sessionFolderId,
      folderUrl: sessionFolder.data.webViewLink
    };
  }
}

module.exports = { DriveManager };
