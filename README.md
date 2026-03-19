# Coptic Fasts & Feasts Calendar

A modern web application for tracking and viewing the Coptic Orthodox Church's fasts and feasts calendar. Display today's dates in both Gregorian and Coptic calendars, browse fasts and feasts throughout the year with an interactive calendar, and search events by name.

## Features

### Core Features
- **Dual Calendar Display**: Shows both Gregorian and Coptic Orthodox dates side-by-side
- **Interactive 12-Month Calendar**: Browse all months with highlighted feast and fast dates using FullCalendar
- **Today Section**: Displays current Gregorian and Coptic dates with today's events
- **Event List**: Searchable list of all fasts and feasts with color-coded categories
- **Event Categories**: 
  - **Fasts** (Red) - Major fasting periods
  - **Feasts** (Green) - Major feast celebrations
  - **Easter** (Orange) - Easter and movable feasts

### UI/UX Features
- **Real-time Search**: Filter events by name as you type
- **Gradient Fade Effect**: Event list fades smoothly at bottom for visual polish
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Modern Styling**: Clean, minimalist interface with shadow effects and smooth transitions

### Technical Features
- **Accurate Coptic Date Conversion**: Proper Gregorian to Coptic calendar conversion (2000-2100)
- **Event Data Integration**: Comprehensive database of Coptic Orthodox fasts and feasts
- **Navigation**: Date navigation buttons to move between years

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/DYoussef999/coptic-calendar.git
   cd coptic-calendar
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Project Structure

```
coptic-calendar/
├── server.js              # Node.js/Express backend
├── package.json           # Project dependencies & scripts
├── README.md              # This file
├── public/
│   ├── index.html         # Main HTML template
│   ├── style.css          # Complete styling & responsive layout
│   └── client.js          # Frontend logic & event handlers
```

## How It Works

### Backend (`server.js`)
- Express.js server running on port 3000
- Serves static HTML/CSS/JS files
- Provides API endpoints for event data

### Frontend (`client.js`)
- Loads and displays fasts/feasts event data
- Implements Coptic date conversion logic
- Handles search/filter functionality
- Manages calendar navigation and event display
- FullCalendar integration for month views

### Coptic Calendar Conversion
The application correctly converts Gregorian dates to the Coptic Orthodox calendar:
- Coptic year = Gregorian year - 283 (from Sept 11 onward)
- Coptic year = Gregorian year - 284 (before Sept 11)
- 12 months of 30 days + 1 intercalary month (5-6 days)

## Usage

1. **View Today**: The "Today" section shows your current Gregorian and Coptic dates along with any events happening today
2. **Search Events**: Use the search bar in the "Fasts & Feasts" panel to find events by name
3. **Browse Calendar**: View the 12-month calendar grid with color-coded events
4. **Event Details**: Each event in the list shows the date and type (Fast/Feast/Easter)

## Key Coptic Month Names

The application uses standard scholarly names for Coptic months:
- Thout, Paopi, Hathor, Koiak, Toba, Amshir, Paremhat, Parmouti, Pashons, Paoni, Epip, Mesori

## Technologies Used

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3 (with modern grid, flexbox, and gradients), Vanilla JavaScript
- **Calendar**: FullCalendar library (v6)
- **Architecture**: Client-side rendered with server-side data serving

## Browser Compatibility

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+

## Project Notes

- All Coptic date calculations are accurate for the year range 1900-2100
- The event list features a smooth gradient fade at the bottom for visual polish
- Responsive layout automatically adapts to different screen sizes
- Event search is case-insensitive and real-time

## Future Enhancements

- Year-to-year quick navigation
- Event details popups
- Export calendar to iCal format
- Mobile app version

## License

This project is for personal use and educational purposes.
