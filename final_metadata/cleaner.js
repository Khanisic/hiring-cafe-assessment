const fs = require('fs');
const path = require('path');

// Directories and files (relative to this script's location)
const baseDir = __dirname;
const inputDir = path.join(baseDir, 'output_jsons');
const finalOutputPath = path.join(baseDir, 'final_output.json');
const finalOutputRedoPath = path.join(baseDir, 'final_output_redo.json');

// Description prefix that marks an error object
const ERROR_PREFIX = 'ERROR: 406 Client Error:';

function isErrorObject(obj) {
    if (!obj || typeof obj !== 'object') return false;
    const desc = obj.description;
    if (typeof desc !== 'string') return false;
    return desc.startsWith(ERROR_PREFIX);
}

function main() {
    if (!fs.existsSync(inputDir)) {
        console.error(`Input directory not found: ${inputDir}`);
        process.exit(1);
    }

    const allFiles = fs.readdirSync(inputDir);
    const jsonFiles = allFiles.filter((f) => f.toLowerCase().endsWith('.json'));

    if (jsonFiles.length === 0) {
        console.error(`No JSON files found in: ${inputDir}`);
        process.exit(1);
    }

    const normalItems = [];
    const errorItems = [];

    for (const file of jsonFiles) {
        const filePath = path.join(inputDir, file);
        console.log(`Processing ${filePath} ...`);

        let raw;
        try {
            raw = fs.readFileSync(filePath, 'utf8');
        } catch (e) {
            console.error(`Failed to read file ${filePath}:`, e.message);
            continue;
        }

        if (!raw.trim()) {
            console.warn(`File is empty or whitespace only, skipping: ${filePath}`);
            continue;
        }

        let data;
        try {
            data = JSON.parse(raw);
        } catch (e) {
            console.error(`Failed to parse JSON in ${filePath}:`, e.message);
            continue;
        }

        if (!Array.isArray(data)) {
            console.warn(`Top-level JSON is not an array in ${filePath}, skipping.`);
            continue;
        }

        for (const obj of data) {
            if (isErrorObject(obj)) {
                errorItems.push(obj);
            } else {
                normalItems.push(obj);
            }
        }
    }

    try {
        fs.writeFileSync(finalOutputPath, JSON.stringify(normalItems, null, 2), 'utf8');
        console.log(`Wrote ${normalItems.length} items to ${finalOutputPath}`);
    } catch (e) {
        console.error(`Failed to write ${finalOutputPath}:`, e.message);
    }

    try {
        fs.writeFileSync(finalOutputRedoPath, JSON.stringify(errorItems, null, 2), 'utf8');
        console.log(`Wrote ${errorItems.length} items to ${finalOutputRedoPath}`);
    } catch (e) {
        console.error(`Failed to write ${finalOutputRedoPath}:`, e.message);
    }
}

if (require.main === module) {
    main();
}

