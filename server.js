const express = require('express');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static('public'));

let browser;

// Initialize browser
async function initBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      protocolTimeout: 60000,
      timeout: 60000
    });
  }
  return browser;
}

// Route for static version
app.get('/static', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'static.html'));
});

// Route for events data (explicit - also served via express.static)
app.get('/events-data.json', (req, res) => {
  const dataPath = path.join(__dirname, 'public', 'events-data.json');
  res.setHeader('Content-Type', 'application/json');
  res.sendFile(dataPath, (err) => {
    if (err) {
      console.error('Error serving events-data.json:', err);
      res.status(404).json({ error: 'Events data file not found. Run extract-events.js first.' });
    }
  });
});

// Scrape the Coptic fasts and feasts data
app.get('/api/fasts-feasts/:year', async (req, res) => {
  let page;
  try {
    const year = req.params.year;
    console.log(`\n=== REQUEST RECEIVED at ${new Date().toLocaleTimeString()} ===`);
    console.log(`Year: ${year}`);
    const browser = await initBrowser();
    console.log('Browser initialized/reused');
    
    page = await browser.newPage();
    console.log('New page created');
    
    // Add longer timeout for this page
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);
    
    // Navigate to the page with the year parameter
    const url = `https://suscopts.org/coptic-orthodox/fasts-and-feasts`;
    console.log(`Navigation started to: ${url} at ${new Date().toLocaleTimeString()}`);
    await page.goto(url, { waitUntil: 'networkidle2' });
    console.log(`Navigation completed at ${new Date().toLocaleTimeString()}`);
    
    // First, log all input and select elements on the page
    const allFormInputs = await page.evaluate(() => {
      const inputs = [];
      document.querySelectorAll('input, select, [role="combobox"]').forEach((el, idx) => {
        inputs.push({
          index: idx,
          tag: el.tagName,
          type: el.type || el.getAttribute('role'),
          name: el.name ||el.getAttribute('name'),
          id: el.id,
          value: el.value,
          options: el.tagName === 'SELECT' ? Array.from(el.options).map(o => ({ text: o.text, value: o.value })) : []
        });
      });
      return inputs;
    });
    console.log('All form inputs found:', JSON.stringify(allFormInputs, null, 2));
    
    // Find and fill the year input field
    const inputFound = await page.evaluate((selectedYear) => {
      let input = null;
      
      // Try to find by various selectors
      input = document.querySelector('input[type="number"]');
      if (!input) input = document.querySelector('input[placeholder*="year" i]');
      if (!input) input = document.querySelector('input[placeholder*="Year" i]');
      if (!input) input = document.querySelector('input[name*="year" i]');
      if (!input) input = document.querySelector('input[id*="year" i]');
      if (!input) input = document.querySelector('input[type="text"]');
      if (!input) input = document.querySelector('input');
      
      if (input) {
        console.log(`Found input: type=${input.type}, name=${input.name}, id=${input.id}`);
        return true;
      }
      return false;
    }, year);
    
    console.log(`Input field found: ${inputFound}`);
    
    if (inputFound) {
      console.log(`Attempting to input year ${year} into combo-box...`);
      
      // Click the input to focus it
      console.log(`Clicking year selector (combo-box)...`);
      await page.click('#combo-box');
      await page.waitForTimeout(500);
      
      // Select all text
      console.log(`Selecting all text in combo-box...`);
      await page.keyboard.press('Home');
      await page.keyboard.down('Shift');
      await page.keyboard.press('End');
      await page.keyboard.up('Shift');
      
      // Type the new year
      console.log(`Typing year: ${year} at ${new Date().toLocaleTimeString()}...`);
      await page.type('#combo-box', year, { delay: 50 });
      
      console.log(`Typed ${year} at ${new Date().toLocaleTimeString()}, now submitting...`);
      
      // Press Enter
      await page.keyboard.press('Enter');
      
      // Wait for AJAX to complete
      console.log(`Waiting for navigation/data to load (networkidle2, timeout 15s)...`);
      try {
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => true);
      } catch(e) {
        // Timeout is OK, page might not navigate
      }
      
      // Additional wait for JS processing
      console.log(`Additional wait for JS processing (2s)...`);
      await page.waitForTimeout(2000);
      
      // Check and log the current input value
      const currentValue = await page.evaluate(() => {
        return document.querySelector('#combo-box')?.value || 'not found';
      });
      console.log(`After submission at ${new Date().toLocaleTimeString()}, combo-box value: ${currentValue}`);
    }
    
    // Wait for data to load
    console.log(`Final wait before content extraction (3s)...`);
    await page.waitForTimeout(3000);
    
    // Check the page title to see if year changed
    const pageTitle = await page.evaluate(() => {
      const title = document.querySelector('h1, h2');
      return title ? title.textContent : '';
    });
    console.log(`Page title after year change at ${new Date().toLocaleTimeString()}: ${pageTitle}`);
    
    // Get the page content
    const contentStart = new Date().toLocaleTimeString();
    const content = await page.content();
    console.log(`Page content retrieved at ${contentStart} (length: ${content.length} bytes)`);
    
    const $ = cheerio.load(content);
    const events = [];
    
    // Debug: check for tables
    const tableCount = $('table').length;
    console.log(`Found ${tableCount} table(s) on the page`);
    
    // Check for header to see if page loaded properly
    const contentHeader = $('h1, h2').first().text().trim();
    console.log(`Page content header: "${contentHeader}"`);
    
    // Parse the table rows
    console.log('--- Starting table parsing ---');
    $('table tbody tr').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 2) {
        const name = $(cells[0]).text().trim();
        const startDate = $(cells[1]).text().trim();
        const endDate = cells.length > 2 ? $(cells[2]).text().trim() : '';
        
        if (name && startDate) {
          events.push({
            name,
            startDate,
            endDate
          });
          console.log(`  Row ${i}: "${name}" (${startDate} - ${endDate || 'single day'})`);
        }
      }
    });
    
    // If no events found, try alternative selector
    if (events.length === 0) {
      console.log(`No events found with tbody selector, trying alternative selectors...`);
      
      // Try finding all tr elements
      $('table tr').each((i, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 2) {
          const name = $(cells[0]).text().trim();
          const startDate = $(cells[1]).text().trim();
          const endDate = cells.length > 2 ? $(cells[2]).text().trim() : '';
          
          if (name && startDate && !name.includes('Holy Nativity') == false) { // Trying to find valid events
            events.push({
              name,
              startDate,
              endDate
            });
            console.log(`  Alt Row ${i}: "${name}" (${startDate} - ${endDate || 'single day'})`);
          }
        }
      });
    }
    
    console.log(`--- Parsing complete ---`);
    console.log(`Scraped ${events.length} events for year ${year}`);
    console.log(`Sending response at ${new Date().toLocaleTimeString()}\n`);
    
    res.json(events);
  } catch (error) {
    console.error('Scraping error for year', req.params.year, ':', error.message);
    res.status(500).json({ error: 'Failed to scrape data', details: error.message });
  } finally {
    if (page) await page.close();
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  if (browser) await browser.close();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`\n📅 Coptic Calendar Server Running!`);
  console.log(`   Base URL: http://localhost:${PORT}`);
  console.log(`\n   📂 Available Versions:`);
  console.log(`      • Dynamic (scrapes live data): http://localhost:${PORT}`);
  console.log(`      • Static (pre-cached data): http://localhost:${PORT}/static`);
  console.log(`\n   📊 API Endpoints:`);
  console.log(`      • Events (dynamic): http://localhost:${PORT}/api/fasts-feasts/:year`);
  console.log(`      • Events (static data): http://localhost:${PORT}/events-data.json`);
  console.log(`\n   💾 Data File: public/events-data.json`);
  console.log(`   🔧 To extract all years (2000-2100), run: node extract-events.js\n`);
});
