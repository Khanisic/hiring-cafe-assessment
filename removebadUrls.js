const fs = require("fs");
const csv = require("csv-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const inputFile = "URLS_So_Far.csv";
const outputFile = "URLS_So_Far_cleaned.csv";

const BLOCKED_SUBSTRINGS = ["linkedin", "wa.me"];

function shouldKeep(row) {
  const url = (row["job_url"] || "").toLowerCase();
  return !BLOCKED_SUBSTRINGS.some((bad) => url.includes(bad));
}

const rows = [];
let headers = null;

fs.createReadStream(inputFile)
  .pipe(csv())
  .on("headers", (hdrs) => {
    headers = hdrs;
  })
  .on("data", (row) => {
    if (shouldKeep(row)) {
      rows.push(row);
    }
  })
  .on("end", async () => {
    const csvWriter = createCsvWriter({
      path: outputFile,
      header: headers.map((h) => ({ id: h, title: h })),
    });
    await csvWriter.writeRecords(rows);
    console.log(`Cleaned file written to ${outputFile}`);
  });