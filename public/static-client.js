/**
 * Static client for Coptic calendar - loads from events-data.json instead of API
 * Usage: Include this in static.html
 */

let currentYear = new Date().getFullYear();
let eventsData = [];
let selectedEvent = null;
let calendar = null;
let allEvents = [];
let allEventsDataMap = {}; // Cache for all years

// Select event and highlight it
function selectEvent(event) {
  selectedEvent = event;
  
  if (event.originalStartDate && window.calendarInstance) {
    const eventDate = new Date(event.originalStartDate + 'T00:00:00');
    window.calendarInstance.gotoDate(eventDate);
  }
  
  const allCalendarEvents = document.querySelectorAll('.fc-event');
  allCalendarEvents.forEach(el => {
    el.classList.remove('selected');
    if (el.querySelector('.fc-event-title')?.textContent === event.name) {
      el.classList.add('selected');
    }
  });
  
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

function clearSelection() {
  selectedEvent = null;
  document.querySelectorAll('.selected').forEach(el => {
    el.classList.remove('selected');
  });
}

function init() {
  loadAndRender();
}

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

// Load events from the static JSON data
async function loadEventsFromData() {
  // Load the static JSON if not already loaded
  if (Object.keys(allEventsDataMap).length === 0) {
    console.log('Loading all events data...');
    try {
      const response = await fetch('./events-data.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to load events data`);
      }
      const data = await response.json();
      allEventsDataMap = data;
      console.log(`Loaded data for ${Object.keys(data).length} years`);
    } catch (error) {
      console.error('Failed to load events data:', error);
      throw error;
    }
  }
  
  // Return data for the current year
  const yearData = allEventsDataMap[currentYear] || [];
  console.log(`Events for ${currentYear}: ${yearData.length} events`);
  
  return yearData.map(event => ({
    name: event.name,
    startDate: event.startDate,
    endDate: event.endDate || undefined
  }));
}

async function loadAndRender() {
  const container = document.getElementById('calendar');
  const list = document.getElementById('eventsList');
  
  list.innerHTML = '';
  
  const loaderInterval = showLoadingWithTimer(container);
  
  try {
    console.log('Loading calendar... (step 1/5) Fetching data');
    
    const currentYearData = await loadEventsFromData();
    
    console.log(`Fetched ${currentYearData.length} events for ${currentYear}`);
    
    let greatFastEndDate = null;
    let goodFridayDate = null;
    let feastOfResurrectionDate = null;
    
    currentYearData.forEach(event => {
      if (event.name.toLowerCase().includes('great fast') && event.endDate) {
        greatFastEndDate = parseDate(event.endDate, currentYear);
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
    
    eventsData = currentYearData.map(event => {
      const isFast = event.name.toLowerCase().includes('nativity fast');
      if (isFast && event.endDate) {
        event.displayEndDate = 'December 31';
      }
      return event;
    });
    
    if (goodFridayDate) {
      const [year, month, day] = goodFridayDate.split('-').map(Number);
      const brightSaturdayDate = new Date(year, month - 1, day + 1);
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
      
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
    
    if (feastOfResurrectionDate && (!goodFridayDate || feastOfResurrectionDate !== goodFridayDate)) {
      const [year, month, day] = feastOfResurrectionDate.split('-').map(Number);
      const brightSaturdayDate = new Date(year, month - 1, day + 1);
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
      
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
    
    window.greatFastEndDate = greatFastEndDate;
    window.feastOfResurrectionDate = feastOfResurrectionDate;
    
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

function createCustomHeader(calendar) {
  const calendarEl = document.getElementById('calendar');
  const existingHeader = calendarEl.querySelector('.fc-custom-header');
  if (existingHeader) {
    existingHeader.remove();
  }
  
  const customHeader = document.createElement('div');
  customHeader.className = 'fc-custom-header';
  
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
  
  calendarEl.insertBefore(customHeader, calendarEl.firstChild);
  
  window.calendarForToday = calendar;
}

function updateCustomHeader(calendar) {
  const currentDate = calendar.getDate();
  const currentMonth = currentDate.getMonth();
  
  const titleEl = document.getElementById('calendar-month-title');
  const prevBtn = document.getElementById('calendar-prev-btn');
  const nextBtn = document.getElementById('calendar-next-btn');
  
  if (titleEl) {
    titleEl.textContent = calendar.view.title;
  }
  
  if (prevBtn) {
    prevBtn.disabled = currentMonth === 0;
  }
  
  if (nextBtn) {
    nextBtn.disabled = currentMonth === 11;
  }
}

function initializeFullCalendar(eventMap) {
  const calendarEl = document.getElementById('calendar');
  calendarEl.innerHTML = '';
  
  const fcEvents = [];
  const processedEventIds = new Set();
  
  for (const dateStr in eventMap) {
    const eventsOnDate = eventMap[dateStr];
    eventsOnDate.forEach(event => {
      const eventId = `${event.originalStartDate || dateStr}___${event.name}`;
      
      if (processedEventIds.has(eventId)) {
        return;
      }
      processedEventIds.add(eventId);
      
      const startDate = event.originalStartDate || dateStr;
      
      let endDate = startDate;
      if (event.endDate) {
        let endYear = currentYear;
        
        const startMonthDay = event.startDate.toLowerCase();
        const endMonthDay = (event.displayEndDate || event.endDate).toLowerCase();
        
        const months = {
          'january': '01', 'february': '02', 'march': '03', 'april': '04',
          'may': '05', 'june': '06', 'july': '07', 'august': '08',
          'september': '09', 'october': '10', 'november': '11', 'december': '12'
        };
        
        const startParts = startMonthDay.split(/\s+/);
        const startMonthNum = months[startParts[0]] || '00';
        const startDayNum = String(parseInt(startParts[1]) || 0).padStart(2, '0');
        const startMD = startMonthNum + startDayNum;
        
        const endParts = endMonthDay.split(/\s+/);
        const endMonthNum = months[endParts[0]] || '00';
        const endDayNum = String(parseInt(endParts[1]) || 0).padStart(2, '0');
        const endMD = endMonthNum + endDayNum;
        
        if (endMD < startMD) {
          endYear = currentYear + 1;
        }
        
        endDate = parseDate(event.displayEndDate || event.endDate, endYear);
      }
      
      fcEvents.push({
        id: eventId,
        title: event.name,
        start: startDate,
        end: new Date(new Date(endDate).getTime() + 86400000).toISOString().split('T')[0],
        extendedProps: {
          isFast: event.name.toLowerCase().includes('fast'),
          originalStartDate: startDate
        }
      });
    });
  }
  
  console.log(`Converted ${fcEvents.length} unique events to FullCalendar format`);
  
  if (window.calendarInstance) {
    window.calendarInstance.destroy();
  }
  
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    initialDate: new Date(currentYear, 0, 1),
    headerToolbar: false,
    height: 'auto',
    contentHeight: 'auto',
    dayMaxEvents: true,
    dayMaxEventRows: 3,
    dayHeaderFormat: { weekday: 'short' },
    events: fcEvents,
    eventDidMount: function(info) {
      const event = info.event;
      const el = info.el;
      
      const eventDate = event.start.toISOString().split('T')[0];
      const isEasterPeriod = window.greatFastEndDate && window.feastOfResurrectionDate &&
                            eventDate > window.greatFastEndDate && 
                            eventDate < window.feastOfResurrectionDate;
      
      if (event.extendedProps.isFast) {
        el.style.backgroundColor = '#f44336';
        el.style.borderColor = '#d32f2f';
      } else if (isEasterPeriod) {
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
  
  createCustomHeader(calendar);
  updateCustomHeader(calendar);
}

function createEventMap() {
  console.log('Creating event map...');
  const map = {};
  
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
  
  const monthStr = String(month).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  return `${year}-${monthStr}-${dayStr}`;
}

function renderEventsList() {
  console.log('Rendering events list...');
  const list = document.getElementById('eventsList');
  list.innerHTML = '';
  
  const uniqueEvents = new Map();
  eventsData.forEach(event => {
    let startYear = currentYear;
    if (event._isPreviousYear) {
      startYear = currentYear;
    }
    
    const startDateStr = parseDate(event.startDate, startYear);
    const key = `${event.name}|||${startDateStr}`;
    if (!uniqueEvents.has(key)) {
      uniqueEvents.set(key, { ...event, originalStartDate: startDateStr });
    }
  });
  
  const eventsCombined = Array.from(uniqueEvents.values());
  eventsCombined.sort((a, b) => (a.originalStartDate || '').localeCompare(b.originalStartDate || ''));
  
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
  
  allEvents = finalEvents;
  
  console.log('Events list rendered');
  
  updateTodaySection();
}

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

function toCopticDate(gregorianDate) {
  const monthsOfMartyrs = [
    'Thout', 'Paopi', 'Hathor', 'Koiak',
    'Toba', 'Amshir', 'Paremhat', 'Parmouti', 
    'Pashons', 'Paoni', 'Epip', 'Mesori', 'Nisi'
  ];
  
  let year = gregorianDate.getFullYear();
  let month = gregorianDate.getMonth();
  let day = gregorianDate.getDate();
  
  let copticYearStart;
  if (month < 8 || (month === 8 && day < 11)) {
    copticYearStart = year - 1;
  } else {
    copticYearStart = year;
  }
  
  const copticYear = copticYearStart - 283;
  
  const baseYear = copticYearStart;
  const isLeapYear = (baseYear % 4 === 0) && ((baseYear % 100 !== 0) || (baseYear % 400 === 0));
  const baseDay = isLeapYear ? 12 : 11;
  
  const copticYearStartDate = new Date(baseYear, 8, baseDay);
  const daysDiff = Math.floor((gregorianDate - copticYearStartDate) / (1000 * 60 * 60 * 24));
  
  let copticMonth = Math.floor(daysDiff / 30) + 1;
  let copticDay = (daysDiff % 30) + 1;
  
  if (copticMonth > 13) {
    copticMonth = 13;
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

function updateTodaySection() {
  const today = new Date();
  const todayISOString = today.getFullYear() + '-' + 
                        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(today.getDate()).padStart(2, '0');
  
  const copticDate = toCopticDate(today);
  const todayContent = document.getElementById('todayContent');
  
  if (!todayContent) return;
  
  const todayEvents = [];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const todayGregorian = `${monthNames[today.getMonth()]} ${today.getDate()}`;
  
  allEvents.forEach(event => {
    if (event.originalStartDate === todayISOString) {
      todayEvents.push(event);
    } else if (event.startDate === todayGregorian) {
      const parsed = parseDate(event.startDate, currentYear);
      if (parsed === todayISOString) {
        todayEvents.push(event);
      }
    } else if (event.endDate) {
      const startYearOffset = event._isPreviousYear ? currentYear : currentYear;
      const startYear = event._isPreviousYear ? currentYear : currentYear;
      const eventStartDate = parseDate(event.startDate, startYear);
      const eventEndDate = event.displayEndDate 
        ? parseDate(event.displayEndDate, currentYear)
        : parseDate(event.endDate, currentYear);
      
      if (eventStartDate && eventEndDate && 
          todayISOString > eventStartDate && 
          todayISOString <= eventEndDate) {
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

function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterEvents(e.target.value);
    });
  }
}

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
