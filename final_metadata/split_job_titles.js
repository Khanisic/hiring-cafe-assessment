const fs = require('fs');
const path = require('path');

// Input file (original JSON)
const INPUT_PATH = path.join(__dirname,'final_output_redo.json');

// Output directory for the split files
const OUTPUT_DIR = path.join(__dirname,'split_job_titles');

// How many output files you want
const NUM_FILES = 10;

function main() {
  // Read and parse the source JSON file
  const raw = fs.readFileSync(INPUT_PATH, 'utf8');
  const data = JSON.parse(raw);

  if (!Array.isArray(data)) {
    throw new Error('Expected the input JSON to be an array of objects.');
  }

  const total = data.length;
  console.log(`Total objects: ${total}`);

  // Compute base chunk size and how many files will get one extra item
  const baseSize = Math.floor(total / NUM_FILES);
  const remainder = total % NUM_FILES; // first "remainder" files get +1

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let startIndex = 0;

  for (let i = 0; i < NUM_FILES; i++) {
    const extra = i < remainder ? 1 : 0;
    const chunkSize = baseSize + extra;

    const chunk = data.slice(startIndex, startIndex + chunkSize);
    const fileIndex = i + 1; // 1-based index for file naming

    const outPath = path.join(
      OUTPUT_DIR,
      `job_titles_with_title_part_${fileIndex}.json`
    );

    fs.writeFileSync(outPath, JSON.stringify(chunk, null, 2), 'utf8');
    console.log(
      `Wrote ${chunk.length} objects to ${path.basename(outPath)} (indices ${startIndex}–${startIndex + chunk.length - 1})`
    );

    startIndex += chunkSize;
  }

  // Sanity check: make sure we used all objects and no duplicates
  if (startIndex !== total) {
    console.warn(
      `Warning: not all objects were used. Used ${startIndex}, total ${total}`
    );
  } else {
    console.log('Done. All objects divided into separate files with no overlap.');
  }
}

main();

