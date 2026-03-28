/**
 * Google Drive Context Connector
 *
 * Fetches content from Google Drive (docs, folders) for injection
 * into the Gemini system prompt as session context.
 *
 * Requires a Google service account with Drive API access.
 * Falls back gracefully if no credentials are configured.
 *
 * Usage:
 *   const { DriveConnector } = require('./context/drive-connector');
 *   const drive = new DriveConnector();
 *   const content = await drive.fetchDocContent('DOC_ID_HERE');
 */

class DriveConnector {
  constructor() {
    this.credentials = null;
    this.drive = null;
    this.initialized = false;
  }

  /**
   * Lazy initialization of Google Drive API client.
   * Returns false if credentials are not available.
   */
  async _init() {
    if (this.initialized) return !!this.drive;

    this.initialized = true;

    try {
      const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT;
      if (!serviceAccountJson) {
        console.log('[DRIVE-CTX] No GOOGLE_SERVICE_ACCOUNT env var — Drive context disabled');
        return false;
      }

      const { google } = require('googleapis');
      this.credentials = JSON.parse(serviceAccountJson);

      const auth = new google.auth.GoogleAuth({
        credentials: this.credentials,
        scopes: ['https://www.googleapis.com/auth/drive.readonly']
      });

      this.drive = google.drive({ version: 'v3', auth });
      console.log('[DRIVE-CTX] Google Drive connector initialized');
      return true;
    } catch (err) {
      console.warn('[DRIVE-CTX] Failed to initialize:', err.message);
      return false;
    }
  }

  /**
   * Fetch the text content of a Google Doc by ID.
   *
   * @param {string} docId - The Google Doc ID
   * @returns {Promise<string|null>} The document text content, or null on failure
   */
  async fetchDocContent(docId) {
    if (!await this._init()) return null;

    try {
      // Export Google Doc as plain text
      const res = await this.drive.files.export({
        fileId: docId,
        mimeType: 'text/plain'
      });

      const content = res.data;
      console.log(`[DRIVE-CTX] Fetched doc ${docId} (${content.length} chars)`);
      return content;
    } catch (err) {
      console.warn(`[DRIVE-CTX] Failed to fetch doc ${docId}:`, err.message);
      return null;
    }
  }

  /**
   * List files in a Google Drive folder.
   *
   * @param {string} folderId - The folder ID
   * @param {string} [mimeType] - Optional MIME type filter (e.g., 'application/vnd.google-apps.document')
   * @returns {Promise<Array>} List of file objects with id, name, mimeType
   */
  async listFolderContents(folderId, mimeType) {
    if (!await this._init()) return [];

    try {
      let query = `'${folderId}' in parents and trashed = false`;
      if (mimeType) {
        query += ` and mimeType = '${mimeType}'`;
      }

      const res = await this.drive.files.list({
        q: query,
        fields: 'files(id, name, mimeType, modifiedTime)',
        orderBy: 'modifiedTime desc',
        pageSize: 20
      });

      console.log(`[DRIVE-CTX] Listed ${res.data.files.length} files in folder ${folderId}`);
      return res.data.files || [];
    } catch (err) {
      console.warn(`[DRIVE-CTX] Failed to list folder ${folderId}:`, err.message);
      return [];
    }
  }

  /**
   * Fetch all Google Docs in a folder and concatenate their text content.
   * Useful for loading an entire project context folder.
   *
   * @param {string} folderId - The folder ID
   * @param {number} [maxDocs=5] - Maximum number of docs to fetch
   * @returns {Promise<string>} Concatenated document content
   */
  async fetchFolderContext(folderId, maxDocs = 5) {
    if (!await this._init()) return '';

    const files = await this.listFolderContents(folderId, 'application/vnd.google-apps.document');

    if (files.length === 0) {
      console.log(`[DRIVE-CTX] No docs found in folder ${folderId}`);
      return '';
    }

    const docsToFetch = files.slice(0, maxDocs);
    const sections = [];

    for (const file of docsToFetch) {
      const content = await this.fetchDocContent(file.id);
      if (content) {
        sections.push(`--- ${file.name} ---`);
        sections.push(content.trim());
        sections.push('');
      }
    }

    const result = sections.join('\n');
    console.log(`[DRIVE-CTX] Loaded ${docsToFetch.length} docs from folder (${result.length} chars total)`);
    return result;
  }

  /**
   * Check if the Drive connector is available (has credentials)
   */
  async isAvailable() {
    return await this._init();
  }
}

module.exports = { DriveConnector };
