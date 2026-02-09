const fs = require('fs');
const path = require('path');

// Directory that contains the partial output JSON files
const OUTPUT_DIR = path.join(__dirname, 'output_jsons');

// All files to combine (11 total in OUTPUT_DIR)
const INPUT_FILES = [
  'jobs_with_metadata_part_1.json',
  'jobs_with_metadata_part_2.json',
  'jobs_with_metadata_part_3.json',
  'jobs_with_metadata_part_4.json',
  'jobs_with_metadata_part_5.json',
  'jobs_with_metadata_part_6.json',
  'jobs_with_metadata_part_7.json',
  'jobs_with_metadata_part_8.json',
  'jobs_with_metadata_part_9.json',
  'jobs_with_metadata_part_10.json',
  'final_main_output_1.json',
];

// Final combined output file (at project root, one level above final_metadata)
const OUTPUT_FILE = path.join(__dirname, '..', 'main_output.json');

function combineFiles() {
  let combined = [];

  for (const file of INPUT_FILES) {
    const filePath = path.join(OUTPUT_DIR, file);

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Skipping missing file: ${filePath}`);
      continue;
    }

    console.log(`📥 Reading: ${filePath}`);
    const raw = fs.readFileSync(filePath, 'utf8').trim();

    if (!raw) {
      console.warn(`⚠️ File is empty, skipping: ${filePath}`);
      continue;
    }

    try {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        combined = combined.concat(data);
      } else {
        console.warn(`⚠️ File does not contain an array, wrapping as single item: ${filePath}`);
        combined.push(data);
      }
    } catch (err) {
      console.error(`❌ Failed to parse JSON from ${filePath}:`, err.message);
    }
  }

  console.log(`📝 Writing combined output: ${OUTPUT_FILE}`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(combined, null, 2), 'utf8');
  console.log(`✅ Done. Total records: ${combined.length}`);
}

combineFiles();

