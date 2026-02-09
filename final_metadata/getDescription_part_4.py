import json
import os
import requests
from bs4 import BeautifulSoup
import time

INPUT_FILE = 'split_job_titles/job_titles_with_title_part_4.json'
OUTPUT_FILE = 'output_jsons/jobs_with_metadata_part_4.json'

def get_job_data(url):
    # Initialize with default structure
    scraped_info = {"description": None}
    
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

        # Try the request, and if we hit a 406, wait 2 minutes and keep retrying
        while True:
            response = requests.get(url, timeout=15, headers=headers)
            if response.status_code == 406:
                print(f"⚠️ Got 406 Not Acceptable for {url}. Waiting 2 minutes before retrying...")
                time.sleep(120)
                continue
            break

        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        # --- 1. DYNAMIC METADATA EXTRACTION ---
        # This finds EVERY field (Job Name, Country, Travel, Req #, Shift, etc.)
        fields = soup.find_all(class_=lambda x: x and 'article__content__view__field' in x)
        
        for field in fields:
            label_div = field.find(class_=lambda x: x and 'field__label' in x)
            value_div = field.find(class_=lambda x: x and 'field__value' in x)
            
            if label_div and value_div:
                key = label_div.get_text(strip=True)
                val = value_div.get_text(separator=' ', strip=True)
                scraped_info[key] = val
            
            # Special case for values without labels (like the "remote based" note)
            elif value_div and not label_div:
                note = value_div.get_text(strip=True)
                if note and "description" not in scraped_info:
                    scraped_info["additional_notes"] = note

        # --- 2. DESCRIPTION EXTRACTION (Refined Rules) ---
        # We look for the description block specifically
        desc_el = None
        keywords = ["Description & Requirements", "Opportunity", "Job Overview", "Descriptions", "Your challenges and objectives:"]
        
        # Check standard containers first
        desc_el = soup.find(class_=["jobDetailTableDescription", "jobDetail", "jobDetailDescription"])
        
        if not desc_el:
            # Look for the article content sibling to the header
            headers_found = soup.find_all(class_=lambda x: x and 'article__header' in x)
            for h in headers_found:
                if any(key in h.get_text() for key in keywords):
                    desc_el = h.find_next_sibling(class_=lambda x: x and 'article__content' in x)
                    if desc_el: break

        if desc_el:
            scraped_info["description"] = desc_el.get_text(separator=' ', strip=True)

    except Exception as e:
        scraped_info["description"] = f"ERROR: {str(e)}"
    
    return scraped_info

def main():
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"❌ Error: {INPUT_FILE} not found.")
        return

    print(f"🚀 Scraping {len(data)} jobs with dynamic metadata...\n")

    # Stream results to the output file so you can see it update live
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write('[\n')
        first = True

        for i, job in enumerate(data, 1):
            url = job.get('application_url')
            
            if url:
                new_data = get_job_data(url)
                # Merge all new keys (Shift, Req #, Travel, etc.) into the job object
                job.update(new_data)
            
            # Real-time feedback in console
            status = "✅" if job.get('description') and "ERROR" not in job['description'] else "❌"
            print(f"[{i}/{len(data)}] ID: {job.get('id')} {status} | Fields Found: {len(job.keys())-3}")

            # Write this job to the output file immediately
            if not first:
                f.write(',\n')
            else:
                first = False

            json.dump(job, f, indent=4, ensure_ascii=False)
            f.flush()
            try:
                os.fsync(f.fileno())
            except OSError:
                # On some systems fsync may not be necessary/available; safe to ignore
                pass

            time.sleep(0.7) # Slightly slower to ensure quality

        f.write('\n]\n')
    
    print(f"\n🎉 Done! All metadata saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()