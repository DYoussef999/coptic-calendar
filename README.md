# Coptic Fasts & Feasts Calendar

A web application that scrapes and displays the Coptic Orthodox Church's fasts and feasts calendar in an interactive calendar format with year selection.

## Features

- **Year Selector**: Choose any year from 2000 to 2100
- **Interactive Calendar**: View all 12 months with highlighted feast and fast dates
- **Event List**: Sortable list of all fasts and feasts with their dates
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Scraping**: Fetches the latest data from suscopts.org

## Installation

1. Navigate to the project directory:
   ```bash
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
├── server.js           # Node.js/Express backend for scraping
├── package.json        # Project dependencies
├── public/
│   ├── index.html      # Main HTML file
│   ├── style.css       # Styling
│   ├── client.js       # Frontend JavaScript logic
```

## How It Works

1. **Backend** (`server.js`):
   - Uses Puppeteer to render the Coptic Orthodox website
   - Scrapes the fasts and feasts table for the selected year
   - Returns JSON data to the frontend

2. **Frontend**:
   - `index.html`: Provides the calendar grid layout and event list
   - `style.css`: Beautiful gradient design with responsive grid layout
   - `client.js`: Handles year selection, date parsing, and calendar rendering

## Usage

1. Select a year from the dropdown (2000-2100)
2. View the calendar with color-coded events:
   - **Blue background**: Feasts (celebrations)
   - **Orange background**: Fasts (restricted periods)
3. Browse the list of all events on the right sidebar
4. Click on individual dates to see event details

## Data Source

The application scrapes data from: https://suscopts.org/coptic-orthodox/fasts-and-feasts

## Technologies Used

- **Backend**: Node.js, Express.js, Puppeteer, Cheerio
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Data Fetching**: Puppeteer for JavaScript rendering

## Browser Compatibility

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+

## Notes

- The first data load may take a few seconds as Puppeteer launches a browser instance
- Subsequent loads are faster due to browser reuse
- The application caches the browser instance for efficiency

## License

This project is for personal use and educational purposes.
