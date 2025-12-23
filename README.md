# Barcode Scanner - Product Lookup

A web application that scans barcodes and retrieves product information (image and name) using the Big Product Data API from RapidAPI.

## Features

- 📷 Camera-based barcode scanning (auto-starts on mobile)
- 📱 **Mobile-optimized**: Fullscreen camera view on mobile devices
- 🔄 Automatic camera activation on mobile devices
- ⌨️ Manual barcode input (desktop only)
- 🖼️ Product image display
- 📝 Product name and details
- 🎨 Modern, responsive UI

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API Key:**
   
   Create a `.env` file in the root directory:
   ```
   REACT_APP_RAPIDAPI_KEY=your_rapidapi_key_here
   ```
   
   Get your API key from [RapidAPI Big Product Data](https://rapidapi.com/bigproductdata/api/big-product-data)

3. **Start the development server:**
   
   For local development with serverless functions, use Vercel CLI:
   ```bash
   npm i -g vercel
   vercel dev
   ```
   
   Or use React development server (serverless functions won't work locally):
   ```bash
   npm start
   ```
   
   The app will open at `http://localhost:3000`

## Usage

1. Click "Start Camera Scanner" to activate the camera
2. Point the camera at a barcode (UPC, EAN, GTIN, etc.)
3. The app will automatically detect the barcode and fetch product information
4. Alternatively, manually enter a barcode in the input field

## API Endpoint

The app uses the Big Product Data API endpoint:
- **Endpoint:** `GET /gtin/{barcode}`
- **Base URL:** `https://big-product-data.p.rapidapi.com`
- **Required Headers:**
  - `X-RapidAPI-Key`: Your RapidAPI key
  - `X-RapidAPI-Host`: `big-product-data.p.rapidapi.com`
  - `Accept`: `application/json`

## Technologies

- React 18
- html5-qrcode (for barcode scanning)
- CSS3 (for styling)

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari (iOS 11+)
- Mobile browsers (iOS Safari, Chrome Mobile, etc.)

## Mobile Features

- **Auto-start camera**: The camera automatically opens when you visit the app on a mobile device
- **Fullscreen scanner**: On mobile, the scanner takes fullscreen for better barcode scanning
- **Back camera**: Automatically uses the rear camera on mobile devices
- **Touch-optimized**: Large touch targets and optimized UI for mobile interaction

**Note:** 
- Camera access requires HTTPS in production or localhost for development
- On mobile, you'll need to grant camera permissions when prompted
- The app detects mobile devices automatically and adjusts the UI accordingly

## Deployment to Vercel

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Set Environment Variable:**
   - Go to your project dashboard on [Vercel](https://vercel.com)
   - Navigate to Settings → Environment Variables
   - Add `REACT_APP_RAPIDAPI_KEY` with your RapidAPI key
   - Redeploy the project

### Option 2: Deploy via GitHub

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect it's a Create React App project

3. **Configure Environment Variables:**
   - In the project settings, go to Environment Variables
   - Add `REACT_APP_RAPIDAPI_KEY` with your RapidAPI key value
   - Select all environments (Production, Preview, Development)
   - Click "Save"

4. **Deploy:**
   - Vercel will automatically deploy on every push to your main branch
   - Your app will be available at `https://your-project.vercel.app`

### Important Notes for Vercel Deployment:

- ✅ The project includes `vercel.json` for proper SPA routing
- ✅ Environment variables must be set in Vercel dashboard (not in `.env` file)
- ✅ HTTPS is automatically enabled on Vercel (required for camera access)
- ✅ The build command `npm run build` is configured automatically
- ✅ Static assets are cached for optimal performance

