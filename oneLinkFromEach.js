// Node.js script to get one link from each domain
// Input: URLS_So_Far_cleaned.csv (with header "job_url")
// Output: one_link_per_domain.csv (also with header "job_url")

const fs = require("fs");
const path = require("path");

// Change these if your filenames differ
const INPUT_FILE = path.join(__dirname, "URLS_So_Far_cleaned.csv");
const OUTPUT_FILE = path.join(__dirname, "one_link_per_domain.csv");

function getDomain(urlStr) {
  try {
    const url = new URL(urlStr.trim());
    return url.hostname.toLowerCase();
  } catch (e) {
    return null; // skip invalid URLs
  }
}

function main() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`Input file not found: ${INPUT_FILE}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(INPUT_FILE, "utf8");

  // Split into lines, handle Windows line endings, and drop empty trailing line if any
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length <= 1) {
    console.error("Input CSV seems to have no data rows.");
    process.exit(1);
  }

  // First line is header (expected: "job_url")
  const header = lines[0];
  const urlLines = lines.slice(1);

  const domainToUrl = new Map();

  for (const line of urlLines) {
    const urlStr = line.trim();
    if (!urlStr) continue;

    const domain = getDomain(urlStr);
    if (!domain) continue;

    // Only keep the first URL we see for each domain
    if (!domainToUrl.has(domain)) {
      domainToUrl.set(domain, urlStr);
    }
  }

  const uniqueUrls = Array.from(domainToUrl.values());

  // Build output CSV content
  const outputLines = [header, ...uniqueUrls];
  const output = outputLines.join("\n");

  fs.writeFileSync(OUTPUT_FILE, output, "utf8");

  console.log(`Wrote ${uniqueUrls.length} unique domains to ${OUTPUT_FILE}`);
}

if (require.main === module) {
  main();
}
