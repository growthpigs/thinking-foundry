/**
 * Google Drive Manager
 *
 * Creates folder structure in Google Drive using a service account.
 * The service account approach avoids user OAuth flows.
 *
 * Flow:
 *   1. Session starts -> createSessionWithPhases() creates:
 *        Thinking Foundry Sessions/
 *        └── [Session Name] - [Date]/
 *            ├── 1 - User Stories/
 *            ├── 2 - Mine/
 *            ├── 3 - Scout/
 *            ├── 4 - Assay/
 *            ├── 5 - Crucible/
 *            ├── 6 - Auditor/
 *            ├── 7 - Plan/
 *            └── 8 - Verify/
 *
 *   2. Phase completes -> writePhaseDoc() writes output into that phase's folder
 *   3. Session folder is shared with the user's email (appears in "Shared with me")
 *
 * Setup:
 *   Set GOOGLE_SERVICE_ACCOUNT_B64 (Railway) or GOOGLE_SERVICE_ACCOUNT (local path)
 */

const { google } = require('googleapis');
const fs = require('fs');

const PHASE_NAMES = [
  'User Stories', 'Mine', 'Scout', 'Assay',
  'Crucible', 'Auditor', 'Plan', 'Verify'
];

class DriveManager {
  constructor() {
    this.drive = null;
    this.initialized = false;
    this.serviceAccountEmail = null;

    // Session state
    this.sessionFolderId = null;
    this.phaseFolderIds = {}; // phaseNum -> folderId
  }

  async init() {
    if (this.initialized) return;

    let keyFile = null;

    // Option 1: Base64-encoded service account JSON (Railway)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_B64) {
      try {
        const decoded = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_B64, 'base64').toString('utf-8');
        keyFile = JSON.parse(decoded);
        console.log('[DRIVE] Using service account from GOOGLE_SERVICE_ACCOUNT_B64');
      } catch (err) {
        throw new Error('Failed to decode GOOGLE_SERVICE_ACCOUNT_B64: ' + err.message);
      }
    }
    // Option 2: File path (local dev)
    else if (process.env.GOOGLE_SERVICE_ACCOUNT) {
      const saPath = process.env.GOOGLE_SERVICE_ACCOUNT;
      if (!fs.existsSync(saPath)) {
        throw new Error('Service account file not found: ' + saPath);
      }
      keyFile = JSON.parse(fs.readFileSync(saPath, 'utf-8'));
      console.log('[DRIVE] Using service account from file: ' + saPath);
    }
    else {
      throw new Error('No Google service account configured. Set GOOGLE_SERVICE_ACCOUNT_B64 or GOOGLE_SERVICE_ACCOUNT');
    }

    this.serviceAccountEmail = keyFile.client_email;
    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ['https://www.googleapis.com/auth/drive']
    });

    this.drive = google.drive({ version: 'v3', auth });
    this.initialized = true;
    console.log('[DRIVE] Initialized — service account: ' + this.serviceAccountEmail);
  }

  /**
   * Find or create the root "Thinking Foundry Sessions" folder
   */
  async getOrCreateRootFolder() {
    await this.init();

    const rootName = 'Thinking Foundry Sessions';

    const res = await this.drive.files.list({
      q: `name='${rootName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    if (res.data.files.length > 0) {
      return res.data.files[0].id;
    }

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
   * Create session folder with all 8 phase subfolders up front.
   * Call this once at session start.
   *
   * @param {string} sessionName - e.g. "Product Strategy" or "Thinking Session"
   * @param {string} [userEmail] - If provided, folder is shared with this email
   * @returns {{ sessionFolderId, sessionFolderUrl, phaseFolderIds }}
   */
  async createSessionWithPhases(sessionName, userEmail) {
    await this.init();

    const rootId = await this.getOrCreateRootFolder();
    const dateStr = new Date().toISOString().split('T')[0];
    const folderName = `${sessionName || 'Thinking Session'} - ${dateStr}`;

    // Create session folder
    const sessionFolder = await this.drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [rootId]
      },
      fields: 'id, webViewLink'
    });

    this.sessionFolderId = sessionFolder.data.id;
    console.log(`[DRIVE] Created session folder: ${folderName} (${this.sessionFolderId})`);

    // Create all 8 phase subfolders
    for (let i = 0; i < PHASE_NAMES.length; i++) {
      const phaseFolder = await this.drive.files.create({
        requestBody: {
          name: `${i + 1} - ${PHASE_NAMES[i]}`,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [this.sessionFolderId]
        },
        fields: 'id'
      });
      this.phaseFolderIds[i] = phaseFolder.data.id;
    }

    console.log(`[DRIVE] Created 8 phase subfolders`);

    // Share with user
    if (userEmail) {
      try {
        await this.drive.permissions.create({
          fileId: this.sessionFolderId,
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
      sessionFolderId: this.sessionFolderId,
      sessionFolderUrl: sessionFolder.data.webViewLink,
      phaseFolderIds: { ...this.phaseFolderIds }
    };
  }

  /**
   * Write phase output into the phase subfolder's description.
   * Uses folder description (metadata, no storage quota needed) instead of
   * file upload, because service accounts have 0 storage quota on personal
   * Google accounts. Description limit is ~8000 chars — enough for summaries.
   *
   * @param {number} phaseNum - 0-7
   * @param {string} content - Phase output text
   * @param {object} [meta] - Optional metadata (confidence, squeezeNotes)
   * @returns {{ folderId, folderUrl } | null}
   */
  async writePhaseDoc(phaseNum, content, meta) {
    if (!this.sessionFolderId) {
      console.warn('[DRIVE] No session folder — call createSessionWithPhases first');
      return null;
    }

    const folderId = this.phaseFolderIds[phaseNum];
    if (!folderId) {
      console.warn(`[DRIVE] No folder for phase ${phaseNum}`);
      return null;
    }

    const phaseName = PHASE_NAMES[phaseNum] || 'Phase ' + phaseNum;
    let description = [
      `Phase ${phaseNum + 1}: ${phaseName}`,
      `Confidence: ${(meta && meta.confidence) || 'N/A'}/10`,
      `Date: ${new Date().toLocaleDateString()}`,
      '',
      content || '(No output captured)',
      '',
      (meta && meta.squeezeNotes) ? 'Squeeze Notes:\n' + meta.squeezeNotes : '',
    ].filter(Boolean).join('\n');

    // Truncate to ~7500 chars to stay within Google's description limit
    if (description.length > 7500) {
      description = description.substring(0, 7497) + '...';
    }

    try {
      const folder = await this.drive.files.update({
        fileId: folderId,
        requestBody: { description },
        fields: 'id, webViewLink'
      });

      console.log(`[DRIVE] Wrote Phase ${phaseNum + 1} (${phaseName}) to folder description`);
      return { folderId: folder.data.id, folderUrl: folder.data.webViewLink };
    } catch (err) {
      console.error(`[DRIVE] Failed to write Phase ${phaseNum} description: ${err.message}`);
      return null;
    }
  }

  /**
   * Check if Drive is configured (has credentials in env).
   * Does NOT initialize — just checks env vars.
   */
  static isConfigured() {
    return !!(process.env.GOOGLE_SERVICE_ACCOUNT_B64 || process.env.GOOGLE_SERVICE_ACCOUNT);
  }
}

module.exports = { DriveManager, PHASE_NAMES };
