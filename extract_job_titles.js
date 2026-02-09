// save as extract_job_titles.js
const fs = require('fs');
const path = require('path');

const INPUT_CSV = path.join(__dirname, 'URLS_So_Far_cleaned_2.csv');
const OUTPUT_JSON = path.join(__dirname, 'job_titles.json');

// markers that indicate where the title segment starts
const MARKERS = ['FolderDetail', 'JobDetail', 'PipelineDetail'];

/**
 * Extract job title from a single URL.
 * - Looks for one of MARKERS in the path
 * - Takes the segment immediately after the marker
 * - Converts hyphens to spaces
 */
function extractTitleFromUrl(urlStr) {
    let url;
    try {
        url = new URL(urlStr);
    } catch {
        return null; // invalid URL
    }

    // Skip URLs with pipelineId or jobId anywhere (path or query)
    const lower = urlStr.toLowerCase();
    if (lower.includes('pipelineid') || lower.includes('jobid')) {
        return null;
    }

    const parts = url.pathname.split('/').filter(Boolean);
    const markerIndex = parts.findIndex((p) => MARKERS.includes(p));

    if (markerIndex === -1 || markerIndex === parts.length - 1) {
        return null; // no marker or nothing after marker
    }

    // Segment immediately after the marker is the title segment
    const rawSegment = parts[markerIndex + 1];
    const decoded = decodeURIComponent(rawSegment);

    // Replace hyphens with spaces, collapse multiple spaces
    const title = decoded.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();

    return title || null;
}

function main() {
    const csvText = fs.readFileSync(INPUT_CSV, 'utf8');
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim() !== '');

    // First line is header: job_url
    const dataLines = lines.slice(1);

    const results = [];

    dataLines.forEach((line, idx) => {
        const application_url = line.trim();
        if (!application_url) return;

        const title = extractTitleFromUrl(application_url);
        if (!title) return;

        results.push({
            id: idx + 1, // or use results.length + 1 if you prefer sequential only for matches
            application_url,
            title,
        });
    });

    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(results, null, 2), 'utf8');
    console.log(`Wrote ${results.length} records to ${OUTPUT_JSON}`);
}

main();