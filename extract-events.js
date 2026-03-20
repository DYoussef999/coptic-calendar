/**
 * Extracts Coptic calendar event data for years 2000-2100
 * Saves to public/events-data.json
 * Run with: node extract-events.js
 */

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'public', 'events-data.json');
const START_YEAR = 2000;
const END_YEAR = 2100;
const YEARS_PER_BATCH = 5; // Process 5 years before saving (in case of failure)

// State tracking for resume capability
let allEvents = {};
let processedYears = new Set();
let failedYears = [];

/**
 * Load any existing partially-processed data
 */
function loadExistingData() {
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      const existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
      allEvents = existing;
      processedYears = new Set(Object.keys(existing).map(Number));
      console.log(`Loaded existing data for ${processedYears.size} years`);
    } catch (err) {
      console.log('Could not load existing data, starting fresh');
    }
  }
}

/**
 * Save data to JSON file
 */
function saveData() {
  const data = {};
  for (const year of Array.from(processedYears).sort((a, b) => a - b)) {
    data[year] = allEvents[year];
  }
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
  console.log(`✓ Saved data for ${processedYears.size} years to ${OUTPUT_FILE}`);
}

/**
 * Scrape events for a single year
 */
async function scrapeYear(browser, year) {
  let page;
  try {
    page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);

    const url = `https://suscopts.org/coptic-orthodox/fasts-and-feasts`;
    console.log(`[${year}] Navigating...`);
    
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Click the year selector and input the year
    await page.click('#combo-box');
    await page.waitForTimeout(300);
    
    // Select all and type new year
    await page.keyboard.press('Home');
    await page.keyboard.down('Shift');
    await page.keyboard.press('End');
    await page.keyboard.up('Shift');
    await page.type('#combo-box', String(year), { delay: 50 });
    
    console.log(`[${year}] Submitting year...`);
    await page.keyboard.press('Enter');
    
    // Wait for AJAX and JS processing
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => true);
    } catch (e) {
      // Timeout is OK
    }
    
    await page.waitForTimeout(2000);
    
    // Get page content
    const content = await page.content();
    const $ = cheerio.load(content);
    
    const events = [];
    
    // Parse table rows
    $('table tr').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 2) {
        const name = $(cells[0]).text().trim();
        const startDate = $(cells[1]).text().trim();
        const endDate = cells.length > 2 ? $(cells[2]).text().trim() : '';
        
        if (name && startDate) {
          events.push({
            name,
            startDate,
            endDate: endDate || undefined
          });
        }
      }
    });
    
    if (events.length === 0) {
      throw new Error('No events found on page');
    }
    
    console.log(`[${year}] ✓ Scraped ${events.length} events`);
    allEvents[year] = events;
    processedYears.add(year);
    
    return true;
  } catch (error) {
    console.error(`[${year}] ✗ Error: ${error.message}`);
    failedYears.push(year);
    return false;
  } finally {
    if (page) await page.close();
  }
}

/**
 * Main extraction process
 */
async function extractAllEvents() {
  loadExistingData();
  
  const browser = await puppeteer.launch({
    protocolTimeout: 60000,
    timeout: 60000,
    args: [
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu'
    ]
  });
  
  try {
    const yearsToProcess = [];
    for (let year = START_YEAR; year <= END_YEAR; year++) {
      if (!processedYears.has(year)) {
        yearsToProcess.push(year);
      }
    }
    
    console.log(`\n📅 Extracting events for ${yearsToProcess.length} year(s)...\n`);
    
    // Process in batches
    for (let i = 0; i < yearsToProcess.length; i++) {
      const year = yearsToProcess[i];
      const success = await scrapeYear(browser, year);
      
      // Save every YEARS_PER_BATCH years or at the end
      if ((i + 1) % YEARS_PER_BATCH === 0 || i === yearsToProcess.length - 1) {
        saveData();
      }
      
      // Add a small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n✅ Extraction complete!`);
    console.log(`   Successfully processed: ${processedYears.size} years`);
    if (failedYears.length > 0) {
      console.log(`   Failed years: ${failedYears.join(', ')}`);
    }
    console.log(`   Output: ${OUTPUT_FILE}`);
    
  } finally {
    await browser.close();
  }
}

// Run the extraction
extractAllEvents().catch(console.error);
