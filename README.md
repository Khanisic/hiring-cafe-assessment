## Hiring Cafe – Job Metadata Pipeline

This repo contains a small data pipeline to clean a large list of job URLs, deduplicate them by domain, extract job titles from URLs, fetch extra metadata, and combine the results into final JSON outputs.

### Overview

- **Input data**: Raw CSV files such as `URLS_So_Far.csv` / `URLS_So_Far_cleaned.csv` containing job URLs.
- **Processing scripts (Node.js)**:
  - `oneLinkFromEach.js`: Takes `URLS_So_Far_cleaned.csv` and writes `one_link_per_domain.csv` with one URL per unique domain.
  - `extract_job_titles.js`: Reads `URLS_So_Far_cleaned_2.csv`, parses job titles from the URL path, and writes `job_titles.json`.
  - `final_metadata/split_job_titles.js`: Splits large job-titles JSON into smaller parts under `final_metadata/split_job_titles/`.
  - `final_metadata/getDescription_part_*.py`: Python scripts (10 parts) that enrich job titles/URLs with descriptions and metadata and write partial JSONs in `final_metadata/output_jsons/`.
  - `final_metadata/combiner.js`: Combines all partial JSON files from `final_metadata/output_jsons/` into a single `main_output.json` at the project root.
- **Final outputs**:
  - `final_main_output.json` / `final_output.json` / `final_metadata/final_output*.json`: Large JSON files with enriched job records.

### Requirements

- **Node.js** (v18+ recommended).
- **Python 3.x** (for the `getDescription_part_*.py` scripts).
- Ability to install Python packages used inside the `getDescription` scripts (e.g. `requests` or similar, if referenced there).

### Setup

1. **Install Node dependencies** (for scripts under `final_metadata`):

   ```bash
   cd "final_metadata"
   npm install
   ```

2. **Prepare input CSVs** in the project root:
   - `URLS_So_Far.csv` / `URLS_So_Far_cleaned.csv`
   - Any cleaned variants expected by the scripts (e.g. `URLS_So_Far_cleaned_2.csv`).

3. **Ensure Python environment**:
   - Install Python 3.
   - Install any dependencies referenced inside the `final_metadata/getDescription_part_*.py` scripts.

### Typical Workflow

1. **Deduplicate URLs by domain**:

   ```bash
   node oneLinkFromEach.js
   ```

   - Input: `URLS_So_Far_cleaned.csv`
   - Output: `one_link_per_domain.csv`

2. **Extract job titles from URLs**:

   ```bash
   node extract_job_titles.js
   ```

   - Input: `URLS_So_Far_cleaned_2.csv`
   - Output: `job_titles.json`

3. **Split job titles into manageable chunks**:

   ```bash
   cd "final_metadata"
   node split_job_titles.js
   ```

   - Input: `../job_titles with_title_copy.json` (or similar source).
   - Output: multiple `job_titles_with_title_part_*.json` files under `final_metadata/split_job_titles/`.

4. **Run metadata-enrichment scripts**:

   ```bash
   cd "final_metadata"
   python getDescription_part_1.py
   python getDescription_part_2.py
   # ...
   python getDescription_part_10.py
   ```

   - Inputs: split job-titles JSON files.
   - Outputs: `jobs_with_metadata_part_*.json` and `final_main_output_1.json` inside `final_metadata/output_jsons/`.

5. **Combine all partial JSONs into one file**:

   ```bash
   cd "final_metadata"
   node combiner.js
   ```

   - Inputs (in `final_metadata/output_jsons/`):
     - `jobs_with_metadata_part_1.json` … `jobs_with_metadata_part_10.json`
     - `final_main_output_1.json`
   - Output: `main_output.json` in the project root.

### Notes

- File names in this `README` match the current scripts; if you change any input/output filenames, update the corresponding constants at the top of each script.
- The pipeline is designed for batch/offline runs; there is no web server or UI in this repo.

