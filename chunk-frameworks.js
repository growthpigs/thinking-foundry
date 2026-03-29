#!/usr/bin/env node
/**
 * Semantic Chunking Pipeline for Thinking Foundry Frameworks
 *
 * Parses all 8 framework markdown files, extracts ### sections as semantic chunks,
 * applies size constraints, and outputs structured JSON for Supabase seeding.
 *
 * Target: 50-80 chunks across all frameworks (~200-400 words optimal per chunk)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const MIN_CHUNK_WORDS = 100;
const MAX_CHUNK_WORDS = 600;
const TARGET_RANGE = { min: 50, max: 80 };

// Framework metadata
const FRAMEWORKS = [
  { id: 'stoicism', path: 'poc/knowledge/mentors/stoicism.md', phases: [0, 1, 3, 4, 5, 6, 7] },
  { id: 'ideo', path: 'poc/knowledge/mentors/ideo.md', phases: [0, 1, 2, 3, 4, 5, 6, 7] },
  { id: 'mckinsey', path: 'poc/knowledge/mentors/mckinsey.md', phases: [0, 1, 2, 3, 4, 5, 6, 7] },
  { id: 'yc', path: 'poc/knowledge/mentors/yc.md', phases: [0, 1, 2, 3, 4, 5, 6, 7] },
  { id: 'lean', path: 'poc/knowledge/mentors/lean.md', phases: [0, 1, 2, 3, 4, 5, 6, 7] },
  { id: 'hormozi', path: 'poc/knowledge/mentors/hormozi.md', phases: [0, 1, 2, 3, 4, 5, 6, 7] },
  { id: 'nate-b-jones', path: 'poc/knowledge/mentors/nate-b-jones.md', phases: [0, 1, 2, 3, 4, 5, 6, 7] },
  { id: 'indydev-dan', path: 'poc/knowledge/mentors/indydev-dan.md', phases: [0, 1, 2, 3, 4, 5, 6, 7] },
];

const wordCount = (text) => text.trim().split(/\s+/).length;
const cleanText = (text) => text.trim().replace(/\n\n+/g, '\n\n');

/**
 * Parse markdown content into structured sections
 * Returns array of { level, title, content, lineStart }
 */
function parseMarkdown(content) {
  const lines = content.split('\n');
  const sections = [];
  let currentSection = null;
  let currentContent = [];
  let lineStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect heading
    const h3Match = line.match(/^### (.+)$/);
    const h4Match = line.match(/^#### (.+)$/);

    if (h3Match || h4Match) {
      // Save previous section
      if (currentSection) {
        sections.push({
          level: currentSection.level,
          title: currentSection.title,
          content: cleanText(currentContent.join('\n')),
          lineStart,
          words: 0, // Will calculate later
        });
      }

      // Start new section
      const level = h3Match ? 3 : 4;
      const title = h3Match ? h3Match[1] : h4Match[1];
      currentSection = { level, title };
      currentContent = [];
      lineStart = i;
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  // Save final section
  if (currentSection) {
    sections.push({
      level: currentSection.level,
      title: currentSection.title,
      content: cleanText(currentContent.join('\n')),
      lineStart,
      words: 0,
    });
  }

  // Calculate word counts
  sections.forEach(s => {
    s.words = wordCount(s.content);
  });

  return sections;
}

/**
 * Sub-chunk large sections that exceed MAX_CHUNK_WORDS
 * Splits on paragraph boundaries
 */
function subChunkLargeSection(section) {
  if (section.words <= MAX_CHUNK_WORDS) {
    return [section];
  }

  const paragraphs = section.content
    .split('\n\n')
    .filter(p => p.trim().length > 0);

  const chunks = [];
  let currentChunk = '';
  let currentWords = 0;

  for (const para of paragraphs) {
    const paraWords = wordCount(para);

    if (currentWords + paraWords > MAX_CHUNK_WORDS && currentChunk.length > 0) {
      // Save current chunk and start new one
      chunks.push(currentChunk.trim());
      currentChunk = para;
      currentWords = paraWords;
    } else {
      if (currentChunk.length > 0) currentChunk += '\n\n';
      currentChunk += para;
      currentWords += paraWords;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks.map((content, idx) => ({
    ...section,
    content,
    words: wordCount(content),
    subChunk: chunks.length > 1 ? idx + 1 : null,
  }));
}

/**
 * Merge small adjacent sections if they share context
 * Keep them separate if they're conceptually distinct
 */
function mergeSmallSections(sections) {
  const merged = [];
  let buffer = null;

  for (const section of sections) {
    if (section.words < MIN_CHUNK_WORDS && buffer) {
      // Merge with previous
      buffer.content += '\n\n' + section.content;
      buffer.words += section.words;
      buffer.mergedTitles = (buffer.mergedTitles || [buffer.title]).concat([section.title]);
    } else {
      // Save previous buffer
      if (buffer && buffer.words >= MIN_CHUNK_WORDS) {
        merged.push(buffer);
      }

      // Start new buffer
      buffer = { ...section };
    }
  }

  // Save final buffer if it meets minimum
  if (buffer && buffer.words >= MIN_CHUNK_WORDS) {
    merged.push(buffer);
  }

  return merged;
}

/**
 * Generate unique chunk ID
 */
function generateChunkId(frameworkId, sectionTitle, subChunkNum = null) {
  const sanitized = sectionTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const suffix = subChunkNum ? `-part${subChunkNum}` : '';
  return `${frameworkId}-${sanitized}${suffix}`;
}

/**
 * Main chunking pipeline
 */
async function chunkAllFrameworks() {
  console.log('🔄 SEMANTIC CHUNKING PIPELINE\n');
  console.log('='.repeat(70));

  const allChunks = [];
  const stats = {
    byFramework: {},
    totalChunks: 0,
    totalWords: 0,
    avgChunkSize: 0,
  };

  for (const fw of FRAMEWORKS) {
    const filePath = path.join(__dirname, fw.path);
    console.log(`\n📖 ${fw.id}`);

    try {
      const content = fs.readFileSync(filePath, 'utf8');

      // Parse markdown into sections
      let sections = parseMarkdown(content);
      console.log(`   Parsed ${sections.length} sections`);

      // Sub-chunk large sections
      let chunked = [];
      for (const section of sections) {
        chunked.push(...subChunkLargeSection(section));
      }
      console.log(`   After sub-chunking: ${chunked.length} chunks`);

      // Merge small sections (optional - only if they're semantically adjacent)
      // For now, keep all sections separate to preserve semantic boundaries
      const finalChunks = chunked.filter(c => c.words >= MIN_CHUNK_WORDS);
      console.log(`   After filtering (<${MIN_CHUNK_WORDS} words): ${finalChunks.length} chunks`);

      // Generate chunk objects
      const frameworkChunks = finalChunks.map((chunk) => ({
        id: generateChunkId(fw.id, chunk.title, chunk.subChunk),
        framework_id: fw.id,
        section: chunk.title,
        content: chunk.content,
        words: chunk.words,
        phases: fw.phases,
        source: `${fw.id}/${chunk.title}`,
      }));

      allChunks.push(...frameworkChunks);
      stats.byFramework[fw.id] = frameworkChunks.length;
      stats.totalChunks += frameworkChunks.length;
      stats.totalWords += finalChunks.reduce((sum, c) => sum + c.words, 0);

      // Log size distribution
      const sizes = finalChunks.map(c => c.words).sort((a, b) => a - b);
      console.log(`   Size range: ${sizes[0]} - ${sizes[sizes.length - 1]} words`);
      console.log(`   Median: ${sizes[Math.floor(sizes.length / 2)]} words`);
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📊 CHUNKING RESULTS\n');

  // Print per-framework stats
  for (const [fwId, count] of Object.entries(stats.byFramework)) {
    const fw = FRAMEWORKS.find(f => f.id === fwId);
    const wordCount = allChunks
      .filter(c => c.framework_id === fwId)
      .reduce((sum, c) => sum + c.words, 0);
    console.log(`✓ ${fwId.padEnd(15)} ${count.toString().padStart(2)} chunks | ${(wordCount/1000).toFixed(1).padStart(4)}KB`);
  }

  stats.avgChunkSize = Math.round(stats.totalWords / stats.totalChunks);

  console.log('\n' + '─'.repeat(70));
  console.log(`
Total chunks: ${stats.totalChunks} (target: 50-80)
Total words: ${stats.totalWords.toLocaleString()}
Avg chunk size: ${stats.avgChunkSize} words
Status: ${stats.totalChunks >= TARGET_RANGE.min && stats.totalChunks <= TARGET_RANGE.max ? '✅ TARGET RANGE' : '⚠️  OUT OF RANGE'}
  `);

  // Verify no chunks are outside bounds
  const outOfBounds = allChunks.filter(c => c.words < MIN_CHUNK_WORDS || c.words > MAX_CHUNK_WORDS);
  if (outOfBounds.length > 0) {
    console.log(`⚠️  WARNING: ${outOfBounds.length} chunks outside [${MIN_CHUNK_WORDS}, ${MAX_CHUNK_WORDS}] word range`);
    outOfBounds.forEach(c => {
      console.log(`   ${c.id}: ${c.words} words`);
    });
  } else {
    console.log('✅ All chunks within word range');
  }

  // Sample 5 random chunks for validation
  console.log('\n📋 SAMPLE CHUNKS (Random 5)\n');
  const sample = allChunks.sort(() => Math.random() - 0.5).slice(0, 5);
  sample.forEach((chunk, idx) => {
    const preview = chunk.content.substring(0, 150).replace(/\n/g, ' ');
    console.log(`${idx + 1}. ${chunk.id}`);
    console.log(`   Framework: ${chunk.framework_id} | Phases: ${chunk.phases.join(',')}`);
    console.log(`   Section: ${chunk.section}`);
    console.log(`   Words: ${chunk.words}`);
    console.log(`   Preview: "${preview}..."\n`);
  });

  // Write output JSON
  const outputPath = path.join(__dirname, 'chunks.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    meta: {
      version: '1.0',
      generated: new Date().toISOString(),
      stats,
    },
    chunks: allChunks,
  }, null, 2));

  console.log(`\n✅ Output saved: ${outputPath}`);
  console.log(`   Total chunks: ${allChunks.length}`);
  console.log(`   File size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)}KB`);

  return allChunks;
}

// Run pipeline
chunkAllFrameworks().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
