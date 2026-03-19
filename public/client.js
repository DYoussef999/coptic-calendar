let currentYear = new Date().getFullYear();
let eventsData = [];
let selectedEvent = null;
let calendar = null; // FullCalendar instance
let allEvents = []; // Store all events for search filtering

// Select event and highlight it
function selectEvent(event) {
  selectedEvent = event;
  
  // Navigate calendar to the event's starting month
  if (event.originalStartDate && window.calendarInstance) {
    const eventDate = new Date(event.originalStartDate + 'T00:00:00');
    window.calendarInstance.gotoDate(eventDate);
  }
  
  // Highlight in calendar
  const allEvents = document.querySelectorAll('.fc-event');
  allEvents.forEach(el => {
    el.classList.remove('selected');
    if (el.querySelector('.fc-event-title')?.textContent === event.name) {
      el.classList.add('selected');
    }
  });
  
  // Highlight in sidebar
  const listItems = document.querySelectorAll('.events-list li');
  listItems.forEach(li => {
    li.classList.remove('selected');
    if (li.getAttribute('data-event-name') === event.name && 
        li.getAttribute('data-event-date') === event.originalStartDate) {
      li.classList.add('selected');
      li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}

// Clear selection
function clearSelection() {
  selectedEvent = null;
  document.querySelectorAll('.selected').forEach(el => {
    el.classList.remove('selected');
  });
}

// Initialize the app
function init() {
  loadAndRender();
}

// Populate year selector and attach event listener
function setupYearSelector(selectElement) {
  for (let year = 2000; year <= 2100; year++) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    if (year === currentYear) option.selected = true;
    selectElement.appendChild(option);
  }
  
  selectElement.addEventListener('change', (e) => {
    currentYear = parseInt(e.target.value);
    loadAndRender();
  });
}

// Show loading indicator with elapsed time
function showLoadingWithTimer(container) {
  const startTime = Date.now();
  const spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let spinnerIndex = 0;
  
  const updateLoader = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const spinner = spinnerChars[spinnerIndex % spinnerChars.length];
    spinnerIndex++;
    container.innerHTML = `<div style="padding: 20px; text-align: center;">
      <div style="font-size: 24px; margin-bottom: 10px;">${spinner}</div>
      <div>Loading calendar...</div>
      <div style="margin-top: 10px; color: #666; font-size: 14px;">${elapsed}s elapsed</div>
    </div>`;
  };
  
  updateLoader();
  return setInterval(updateLoader, 100);
}

// Load data and render calendar
async function loadAndRender() {
  const container = document.getElementById('calendar');
  const list = document.getElementById('eventsList');
  
  // Hide sidebar while loading
  list.innerHTML = '';
  
  const loaderInterval = showLoadingWithTimer(container);
  
  try {
    console.log('Loading calendar... (step 1/5) Fetching data');
    
    // Fetch only current year data
    const currentYearData = await fetchFastsFeasts(currentYear);
    
    console.log(`Fetched ${currentYearData.length} events for ${currentYear}`);
    
    // Find Great Fast end date and Feast of Resurrection for Easter period identification
    let greatFastEndDate = null;
    let goodFridayDate = null;
    let feastOfResurrectionDate = null;
    
    currentYearData.forEach(event => {
      if (event.name.toLowerCase().includes('great fast') && event.endDate) {
        greatFastEndDate = parseDate(event.endDate, currentYear);
        // Good Friday is the day after Great Fast ends (Great Fast ends Thursday, Good Friday is Friday)
        if (greatFastEndDate) {
          const [year, month, day] = greatFastEndDate.split('-').map(Number);
          const goodFriday = new Date(year, month - 1, day + 1);
          goodFridayDate = `${goodFriday.getFullYear()}-${String(goodFriday.getMonth() + 1).padStart(2, '0')}-${String(goodFriday.getDate()).padStart(2, '0')}`;
        }
      }
      if (event.name.toLowerCase().includes('good friday')) {
        goodFridayDate = parseDate(event.startDate, currentYear);
      }
      if (event.name.toLowerCase().includes('resurrection') && event.startDate) {
        feastOfResurrectionDate = parseDate(event.startDate, currentYear);
      }
    });
    
    // Process events
    eventsData = currentYearData.map(event => {
      const isFast = event.name.toLowerCase().includes('nativity fast');
      if (isFast && event.endDate) {
        // For current year's Nativity Fast, truncate end date to Dec 31
        event.displayEndDate = 'December 31';
      }
      return event;
    });
    
    // Add Bright Saturday - day after Good Friday
    if (goodFridayDate) {
      const [year, month, day] = goodFridayDate.split('-').map(Number);
      const brightSaturdayDate = new Date(year, month - 1, day + 1);
      
      // Convert date back to readable format
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
      
      // Check if Bright Saturday already exists
      const brightSatExists = eventsData.some(e => 
        e.name === 'Bright Saturday' && 
        e.startDate === `${monthNames[brightSaturdayDate.getMonth()]} ${brightSaturdayDate.getDate()}`
      );
      
      if (!brightSatExists) {
        eventsData.push({
          name: 'Bright Saturday',
          startDate: `${monthNames[brightSaturdayDate.getMonth()]} ${brightSaturdayDate.getDate()}`,
          _eastPeriod: true
        });
      }
    }
    
    // Also add Bright Saturday - day after Feast of Resurrection (if different)
    if (feastOfResurrectionDate && (!goodFridayDate || feastOfResurrectionDate !== goodFridayDate)) {
      const [year, month, day] = feastOfResurrectionDate.split('-').map(Number);
      const brightSaturdayDate = new Date(year, month - 1, day + 1);
      const brightSatYear = brightSaturdayDate.getFullYear();
      const brightSatMonth = String(brightSaturdayDate.getMonth() + 1).padStart(2, '0');
      const brightSatDay = String(brightSaturdayDate.getDate()).padStart(2, '0');
      
      // Convert date back to readable format
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
      
      // Check if this Bright Saturday already exists
      const brightSatExists = eventsData.some(e => 
        e.name === 'Bright Saturday' && 
        e.startDate === `${monthNames[brightSaturdayDate.getMonth()]} ${brightSaturdayDate.getDate()}`
      );
      
      if (!brightSatExists) {
        eventsData.push({
          name: 'Bright Saturday',
          startDate: `${monthNames[brightSaturdayDate.getMonth()]} ${brightSaturdayDate.getDate()}`,
          _eastPeriod: true
        });
      }
    }
    
    // Store Easter period dates for event coloring
    window.greatFastEndDate = greatFastEndDate;
    window.feastOfResurrectionDate = feastOfResurrectionDate;
    
    // Always add Jan 1-6 as previous year's nativity fast
    eventsData.unshift({
      name: 'Nativity Fast',
      startDate: 'January 1',
      endDate: 'January 6',
      _isPreviousYear: true
    });
    
    console.log(`Total events: ${eventsData.length}`);
    
    console.log('Loading calendar... (step 2/5) Creating event map');
    const eventMap = createEventMap();
    console.log('Event map created');
    
    console.log('Loading calendar... (step 3/5) Rendering calendar');
    initializeFullCalendar(eventMap);
    
    console.log('Loading calendar... (step 4/5) Rendering events list');
    renderEventsList();
    
    console.log('Loading calendar... (step 5/5) Done!');
  } catch (error) {
    console.error('Error:', error);
    container.innerHTML = `<div style="padding: 20px; color: #e74c3c;">Error: ${error.message}</div>`;
  } finally {
    clearInterval(loaderInterval);
  }
}

// Create custom header with prev/next buttons and month title (today button moved to today section)
function createCustomHeader(calendar) {
  const calendarEl = document.getElementById('calendar');
  
  // Remove existing header if it exists
  const existingHeader = calendarEl.querySelector('.fc-custom-header');
  if (existingHeader) {
    existingHeader.remove();
  }
  
  const customHeader = document.createElement('div');
  customHeader.className = 'fc-custom-header';
  
  // Left section: Year selector
  const leftSection = document.createElement('div');
  leftSection.className = 'fc-custom-header-left';
  
  const yearSelectorDiv = document.createElement('div');
  yearSelectorDiv.className = 'year-selector-inline';
  
  const yearLabel = document.createElement('label');
  yearLabel.setAttribute('for', 'yearSelect');
  yearLabel.textContent = 'Year:';
  yearLabel.style.marginRight = '4px';
  
  const yearSelect = document.createElement('select');
  yearSelect.id = 'yearSelect';
  setupYearSelector(yearSelect);
  
  yearSelectorDiv.appendChild(yearLabel);
  yearSelectorDiv.appendChild(yearSelect);
  leftSection.appendChild(yearSelectorDiv);
  
  // Center section: Prev button, Month title, Next button
  const centerSection = document.createElement('div');
  centerSection.className = 'fc-custom-header-center';
  
  const prevBtn = document.createElement('button');
  prevBtn.textContent = '‹';
  prevBtn.className = 'nav-btn';
  prevBtn.id = 'calendar-prev-btn';
  prevBtn.title = 'Previous month';
  prevBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const currentDate = calendar.getDate();
    if (currentDate.getMonth() > 0) {
      calendar.prev();
    }
  });
  
  const titleSpan = document.createElement('div');
  titleSpan.className = 'fc-custom-header-title';
  titleSpan.id = 'calendar-month-title';
  titleSpan.textContent = calendar.view.title;
  
  const nextBtn = document.createElement('button');
  nextBtn.textContent = '›';
  nextBtn.className = 'nav-btn';
  nextBtn.id = 'calendar-next-btn';
  nextBtn.title = 'Next month';
  nextBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const currentDate = calendar.getDate();
    if (currentDate.getMonth() < 11) {
      calendar.next();
    }
  });
  
  centerSection.appendChild(prevBtn);
  centerSection.appendChild(titleSpan);
  centerSection.appendChild(nextBtn);
  
  customHeader.appendChild(leftSection);
  customHeader.appendChild(centerSection);
  
  // Insert header as the first child of the calendar div
  calendarEl.insertBefore(customHeader, calendarEl.firstChild);
  
  // Store calendar reference for today button
  window.calendarForToday = calendar;
}

// Update custom header button states and title based on current month/year
function updateCustomHeader(calendar) {
  const currentDate = calendar.getDate();
  const currentMonth = currentDate.getMonth();
  
  const titleEl = document.getElementById('calendar-month-title');
  const prevBtn = document.getElementById('calendar-prev-btn');
  const nextBtn = document.getElementById('calendar-next-btn');
  
  if (titleEl) {
    titleEl.textContent = calendar.view.title;
  }
  
  // Disable prev button if at January of the selected year
  if (prevBtn) {
    prevBtn.disabled = currentMonth === 0;
  }
  
  // Disable next button if at December of the selected year
  if (nextBtn) {
    nextBtn.disabled = currentMonth === 11;
  }
}

// Initialize FullCalendar with navigation
function initializeFullCalendar(eventMap) {
  const calendarEl = document.getElementById('calendar');
  calendarEl.innerHTML = ''; // Clear loading message
  
  // Convert event map to FullCalendar format
  const fcEvents = [];
  const processedEventIds = new Set();
  
  for (const dateStr in eventMap) {
    const eventsOnDate = eventMap[dateStr];
    eventsOnDate.forEach(event => {
      // Use originalStartDate for grouping multi-day events
      const eventId = `${event.originalStartDate || dateStr}___${event.name}`;
      
      // Skip if we already processed this event
      if (processedEventIds.has(eventId)) {
        return;
      }
      processedEventIds.add(eventId);
      
      // For multi-day events, use the original start date
      const startDate = event.originalStartDate || dateStr;
      
      // Get the end date from the event's endDate property (converted to calendar year)
      let endDate = startDate;
      if (event.endDate) {
        // Parse the endDate using the same logic as startDate
        let endYear = currentYear;
        
        // Determine if end date is in a different year by comparing chronologically
        const startMonthDay = event.startDate.toLowerCase();
        const endMonthDay = (event.displayEndDate || event.endDate).toLowerCase();
        
        // Extract month/day numbers for comparison
        const months = {
          'january': '01', 'february': '02', 'march': '03', 'april': '04',
          'may': '05', 'june': '06', 'july': '07', 'august': '08',
          'september': '09', 'october': '10', 'november': '11', 'december': '12'
        };
        
        // Parse start month/day
        const startParts = startMonthDay.split(/\s+/);
        const startMonthNum = months[startParts[0]] || '00';
        const startDayNum = String(parseInt(startParts[1]) || 0).padStart(2, '0');
        const startMD = startMonthNum + startDayNum;
        
        // Parse end month/day
        const endParts = endMonthDay.split(/\s+/);
        const endMonthNum = months[endParts[0]] || '00';
        const endDayNum = String(parseInt(endParts[1]) || 0).padStart(2, '0');
        const endMD = endMonthNum + endDayNum;
        
        // If end date is before start date chronologically, it must be in next year
        if (endMD < startMD) {
          endYear = currentYear + 1;
        }
        
        endDate = parseDate(event.displayEndDate || event.endDate, endYear);
      }
      
      fcEvents.push({
        id: eventId,
        title: event.name,
        start: startDate,
        end: new Date(new Date(endDate).getTime() + 86400000).toISOString().split('T')[0], // FullCalendar uses exclusive end dates
        extendedProps: {
          isFast: event.name.toLowerCase().includes('fast'),
          originalStartDate: startDate
        }
      });
    });
  }
  
  console.log(`Converted ${fcEvents.length} unique events to FullCalendar format`);
  
  // Destroy any existing calendar
  if (window.calendarInstance) {
    window.calendarInstance.destroy();
  }
  
  // Create single calendar instance
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    initialDate: new Date(currentYear, 0, 1),
    headerToolbar: false, // Disable default toolbar, we'll create custom one
    height: 'auto',
    contentHeight: 'auto',
    dayMaxEvents: true,
    dayMaxEventRows: 3,
    dayHeaderFormat: { weekday: 'short' },
    events: fcEvents,
    eventDidMount: function(info) {
      const event = info.event;
      const el = info.el;
      
      // Remove default styling and color based on fast/feast/easter period
      const eventDate = event.start.toISOString().split('T')[0];
      const isEasterPeriod = window.greatFastEndDate && window.feastOfResurrectionDate &&
                            eventDate > window.greatFastEndDate && 
                            eventDate < window.feastOfResurrectionDate;
      
      if (event.extendedProps.isFast) {
        el.style.backgroundColor = '#f44336';
        el.style.borderColor = '#d32f2f';
      } else if (isEasterPeriod) {
        // Orange for events between end of Great Fast and Feast of Resurrection
        el.style.backgroundColor = '#ff9800';
        el.style.borderColor = '#e65100';
      } else {
        el.style.backgroundColor = '#4caf50';
        el.style.borderColor = '#388e3c';
      }
      
      el.style.cursor = 'pointer';
      
      el.addEventListener('click', function(clickEvent) {
        clickEvent.stopPropagation();
        selectEvent({
          name: event.title,
          originalStartDate: event.extendedProps.originalStartDate
        });
      });
    },
    datesSet: function(info) {
      updateCustomHeader(calendar);
    }
  });
  
  window.calendarInstance = calendar;
  calendar.render();
  
  // Create custom header with prev/next buttons and month title
  createCustomHeader(calendar);
  updateCustomHeader(calendar);
}

// Fetch fasts and feasts from the API
async function fetchFastsFeasts(year) {
  const url = `/api/fasts-feasts/${year}?t=${Date.now()}`;
  console.log(`Fetching from: ${url}`);
  console.log('Request started at:', new Date().toLocaleTimeString());
  
  try {
    const response = await fetch(url);
    console.log('Response received at:', new Date().toLocaleTimeString());
    console.log('Status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Data received:', data);
    console.log('Number of events:', data.length);
    console.log('Events:', data.map(e => `${e.name} (${e.startDate} - ${e.endDate || 'single day'})`));
    
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// Show loading indicator
function showLoader() {
  const loader = document.createElement('div');
  loader.className = 'loading';
  loader.textContent = 'Loading calendar...';
  document.getElementById('calendar').innerHTML = '';
  document.getElementById('calendar').appendChild(loader);
  return loader;
}

// Show error message
function showError(message) {
  const error = document.createElement('div');
  error.className = 'loading';
  error.style.color = '#e74c3c';
  error.textContent = message;
  document.getElementById('calendar').innerHTML = '';
  document.getElementById('calendar').appendChild(error);
}

// Render the calendar for all months
function renderCalendar() {
  console.log('renderCalendar called - deprecated, using FullCalendar now');
}

// Create event map for quick lookup, including date ranges
function createEventMap() {
  console.log('Creating event map...');
  const map = {};
  
  // Simple approach: just store events with their start/end dates, don't expand
  eventsData.forEach(event => {
    let startYear = currentYear;
    if (event._isPreviousYear) {
      startYear = currentYear;
    }
    
    let startDateStr = parseDate(event.startDate, startYear);
    
    if (startDateStr) {
      if (!map[startDateStr]) {
        map[startDateStr] = [];
      }
      map[startDateStr].push({...event, originalStartDate: startDateStr});
    }
  });
  
  console.log('Event map created with', Object.keys(map).length, 'unique dates');
  return map;
}

// Get all dates between two date strings (YYYY-MM-DD format)
function getDateRange(startStr, endStr) {
  const dates = [];
  
  // Parse ISO date strings into local date components
  const [startY, startM, startD] = startStr.split('-').map(Number);
  const [endY, endM, endD] = endStr.split('-').map(Number);
  
  // Create dates in local time (not UTC)
  const start = new Date(startY, startM - 1, startD);
  const end = new Date(endY, endM - 1, endD);
  
  let current = new Date(start);
  while (current <= end) {
    // Format date as ISO string using local date components
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// Parse date string to ISO format (YYYY-MM-DD)
function parseDate(dateStr, year) {
  if (!dateStr) return null;
  
  const months = {
    'january': 1, 'february': 2, 'march': 3, 'april': 4,
    'may': 5, 'june': 6, 'july': 7, 'august': 8,
    'september': 9, 'october': 10, 'november': 11, 'december': 12
  };

  const parts = dateStr.trim().split(/\s+/);
  if (parts.length < 2) return null;

  const monthName = parts[0].toLowerCase();
  const day = parseInt(parts[1]);

  if (!months[monthName] || isNaN(day)) return null;

  const month = months[monthName];
  
  // Format directly without using Date's toISOString() to avoid timezone issues
  const monthStr = String(month).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  return `${year}-${monthStr}-${dayStr}`;
}

// Old month element function - no longer needed with FullCalendar
// Kept as stub for backward compatibility
function createMonthElement(month, daysInMonth, eventMap) {
  console.log('createMonthElement deprecated - using FullCalendar');
  return document.createElement('div');
}

// Old pill creation function - no longer needed with FullCalendar
// Kept as stub for backward compatibility
function createEventPills(monthEl, month, daysInMonth, eventMap) {
  console.log('createEventPills deprecated - using FullCalendar');
}

// Render events list in sidebar
function renderEventsList() {
  console.log('Rendering events list...');
  const list = document.getElementById('eventsList');
  list.innerHTML = '';
  
  // Get unique events with their originalStartDate
  const uniqueEvents = new Map();
  eventsData.forEach(event => {
    let startYear = currentYear;
    if (event._isPreviousYear) {
      startYear = currentYear;  // Jan 1-6 is always in current year
    }
    
    const startDateStr = parseDate(event.startDate, startYear);
    const key = `${event.name}|||${startDateStr}`;
    if (!uniqueEvents.has(key)) {
      uniqueEvents.set(key, { ...event, originalStartDate: startDateStr });
    }
  });
  
  // Combine and sort by start date
  const eventsCombined = Array.from(uniqueEvents.values());
  eventsCombined.sort((a, b) => (a.originalStartDate || '').localeCompare(b.originalStartDate || ''));
  
  // Remove duplicates based on name and originalStartDate
  const finalEvents = [];
  const seenKeys = new Set();
  eventsCombined.forEach(event => {
    const key = `${event.name}|||${event.originalStartDate}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      finalEvents.push(event);
    }
  });
  
  finalEvents.forEach(event => {
    const li = document.createElement('li');
    li.className = 'event-item';
    li.setAttribute('data-event-name', event.name);
    li.setAttribute('data-event-date', event.originalStartDate || parseDate(event.startDate, currentYear));
    
    const isFast = event.name.toLowerCase().includes('fast');
    li.className = `event-item ${isFast ? 'event-fast' : 'event-feast'}`;
    
    // Format date range for display - use displayEndDate if available
    let dateRange = event.startDate;
    const endDate = event.displayEndDate || event.endDate;
    if (endDate && endDate !== event.startDate) {
      dateRange = `${event.startDate} - ${endDate}`;
    }
    
    li.innerHTML = `
      <div class="event-name">${event.name}</div>
      <div class="event-date">${dateRange}</div>
    `;
    
    li.addEventListener('click', () => {
      selectEvent({
        name: event.name,
        originalStartDate: event.originalStartDate || parseDate(event.startDate, currentYear)
      });
    });
    
    list.appendChild(li);
  });
  
  // Store events for search
  allEvents = finalEvents;
  
  console.log('Events list rendered');
  
  // Update Today section
  updateTodaySection();
}

// Filter events based on search input
function filterEvents(searchTerm) {
  const list = document.getElementById('eventsList');
  const items = list.querySelectorAll('.event-item');
  const lowerSearchTerm = searchTerm.toLowerCase();
  let visibleCount = 0;
  
  items.forEach(item => {
    const eventName = item.getAttribute('data-event-name').toLowerCase();
    const eventDate = item.getAttribute('data-event-date');
    
    if (eventName.includes(lowerSearchTerm) || eventDate.includes(lowerSearchTerm)) {
      item.style.display = 'block';
      visibleCount++;
    } else {
      item.style.display = 'none';
    }
  });
  
  // Show or hide "no results" message
  const noResultsMsg = list.querySelector('.no-results');
  if (visibleCount === 0 && searchTerm.trim() !== '') {
    if (!noResultsMsg) {
      const msg = document.createElement('div');
      msg.className = 'no-results';
      msg.textContent = 'No events found matching your search';
      list.appendChild(msg);
    }
  } else if (noResultsMsg) {
    noResultsMsg.remove();
  }
}

// Convert Gregorian date to Coptic calendar
function toCopticDate(gregorianDate) {
  // Coptic calendar epoch: Diocletian era (284 AD)
  // For Gregorian dates (1900-2099): Coptic year starts September 11 (or Sept 12 before a leap year)
  
  const monthsOfMartyrs = [
    'Thout', 'Paopi', 'Hathor', 'Koiak',
    'Toba', 'Amshir', 'Paremhat', 'Parmouti', 
    'Pashons', 'Paoni', 'Epip', 'Mesori', 'Nisi'
  ];
  
  let year = gregorianDate.getFullYear();
  let month = gregorianDate.getMonth(); // 0-11
  let day = gregorianDate.getDate();
  
  // Determine Coptic year
  // Coptic year starts September 11 (or Sept 12 before a Gregorian leap year)
  let copticYearStart;
  if (month < 8 || (month === 8 && day < 11)) {
    // Before September 11 - still in previous Coptic year
    copticYearStart = year - 1;
  } else {
    copticYearStart = year;
  }
  
  const copticYear = copticYearStart - 283; // Year 1 starts at Sept 11, 283 AD (Gregorian equiv)
  
  // Calculate base date for this Coptic year (September 11 or 12)
  // Check if the year from which this Coptic year starts is a leap year
  const baseYear = copticYearStart;
  const isLeapYear = (baseYear % 4 === 0) && ((baseYear % 100 !== 0) || (baseYear % 400 === 0));
  const baseDay = isLeapYear ? 12 : 11; // Sept 12 before leap year, Sept 11 otherwise
  
  const copticYearStartDate = new Date(baseYear, 8, baseDay); // September (month 8)
  const daysDiff = Math.floor((gregorianDate - copticYearStartDate) / (1000 * 60 * 60 * 24));
  
  // Each Coptic month has 30 days, except month 13 (Mesori) which has 5-6 days
  let copticMonth = Math.floor(daysDiff / 30) + 1;
  let copticDay = (daysDiff % 30) + 1;
  
  // Handle month 13 (intercalary days/Nisi)
  if (copticMonth > 13) {
    copticMonth = 13;
    // Check if this Coptic year is a leap year (has 6 intercalary days)
    copticDay = Math.min(copticDay, 5 + (copticYear % 4 === 0 ? 1 : 0));
  }
  
  if (copticDay > 30 && copticMonth < 13) {
    copticMonth++;
    copticDay -= 30;
  }
  
  const monthName = monthsOfMartyrs[copticMonth - 1];
  
  return {
    month: monthName,
    day: copticDay,
    year: copticYear
  };
}

// Update the Today section with current date and events
function updateTodaySection() {
  const today = new Date();
  const todayISOString = today.getFullYear() + '-' + 
                        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(today.getDate()).padStart(2, '0');
  
  const copticDate = toCopticDate(today);
  const todayContent = document.getElementById('todayContent');
  
  if (!todayContent) return;
  
  // Get today's events (including multi-day events)
  const todayEvents = [];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const todayGregorian = `${monthNames[today.getMonth()]} ${today.getDate()}`;
  
  allEvents.forEach(event => {
    // Check if event starts today
    if (event.originalStartDate === todayISOString) {
      todayEvents.push(event);
    } else if (event.startDate === todayGregorian) {
      // Check by parsed date
      const parsed = parseDate(event.startDate, currentYear);
      if (parsed === todayISOString) {
        todayEvents.push(event);
      }
    } else if (event.endDate) {
      // Check if today falls within a multi-day event
      const startYearOffset = event._isPreviousYear ? currentYear : currentYear;
      const startYear = event._isPreviousYear ? currentYear : currentYear;
      const eventStartDate = parseDate(event.startDate, startYear);
      const eventEndDate = event.displayEndDate 
        ? parseDate(event.displayEndDate, currentYear)
        : parseDate(event.endDate, currentYear);
      
      if (eventStartDate && eventEndDate && 
          todayISOString > eventStartDate && 
          todayISOString <= eventEndDate) {
        // Check if not already added
        if (!todayEvents.find(e => e.name === event.name && e.startDate === event.startDate)) {
          todayEvents.push(event);
        }
      }
    }
  });
  
  let html = `
    <div class="today-date">
      <div class="today-date-label">Gregorian</div>
      <div class="today-date-value">${todayGregorian}, ${today.getFullYear()}</div>
      <div class="today-date-label" style="margin-top: 8px;">Coptic Calendar</div>
      <div class="today-date-value">${copticDate.month} ${copticDate.day}, Year ${copticDate.year}</div>
      <button id="today-nav-btn" class="today-nav-btn" title="Go to today">Today</button>
    </div>
  `;
  
  if (todayEvents.length > 0) {
    html += '<div class="today-events">';
    html += '<div class="today-event-label">Events Today</div>';
    todayEvents.forEach(event => {
      const isFast = event.name.toLowerCase().includes('fast');
      const isEasterPeriod = event._eastPeriod || (window.greatFastEndDate && window.feastOfResurrectionDate &&
                            todayISOString > window.greatFastEndDate && 
                            todayISOString < window.feastOfResurrectionDate);
      
      let eventClass = 'today-event-item';
      if (isFast) {
        eventClass += ' event-fast';
      } else if (isEasterPeriod) {
        eventClass += ' event-easter';
      } else {
        eventClass += ' event-feast';
      }
      
      html += `<div class="${eventClass}">${event.name}</div>`;
    });
    html += '</div>';
  } else {
    html += '<div class="today-events"><div class="today-event-label">No events today</div></div>';
  }
  
  todayContent.innerHTML = html;
  
  // Add event listener to today button
  const todayBtn = document.getElementById('today-nav-btn');
  if (todayBtn && window.calendarForToday) {
    todayBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const now = new Date();
      if (now.getFullYear() === currentYear) {
        window.calendarForToday.gotoDate(now);
      } else {
        window.calendarForToday.gotoDate(new Date(currentYear, 0, 1));
      }
    });
  }
}

// Setup search functionality
function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterEvents(e.target.value);
    });
  }
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
    setupSearch();
    updateTodaySection();
  });
} else {
  init();
  setupSearch();
  updateTodaySection();
}
