/**
 * GitHub Export
 *
 * Creates a GitHub issue with the full session transcript
 * and labels it by phases covered.
 */

const { Octokit } = require('@octokit/rest');

async function exportToGitHub({ sessionName, transcript, phases }) {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN not configured');
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = process.env.GITHUB_OWNER || 'growthpigs';
  const repo = process.env.GITHUB_REPO || 'thinking-foundry';

  // Build phase labels
  const phaseLabels = (phases || []).map(p => `phase-${p}`);

  // Build issue body
  const body = [
    `# Thinking Foundry Session: ${sessionName}`,
    '',
    `**Date:** ${new Date().toISOString()}`,
    `**Phases Covered:** ${(phases || []).join(', ') || 'None recorded'}`,
    '',
    '---',
    '',
    '## Full Transcript',
    '',
    transcript || '_No transcript captured_',
    '',
    '---',
    '',
    '_Exported automatically by The Thinking Foundry_'
  ].join('\n');

  console.log(`[GITHUB] Creating issue in ${owner}/${repo}: "${sessionName}"`);

  const result = await octokit.issues.create({
    owner,
    repo,
    title: `Session: ${sessionName} — ${new Date().toLocaleDateString()}`,
    body,
    labels: ['session', ...phaseLabels]
  });

  console.log(`[GITHUB] Issue created: ${result.data.html_url}`);
  return result.data;
}

module.exports = { exportToGitHub };
