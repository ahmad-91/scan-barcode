/**
 * Vercel Serverless Function to proxy Barcode Lookup API requests
 * This solves the CORS issue by making the API call from the server side
 */

const BARCODE_LOOKUP_API_BASE_URL = 'https://api.barcodelookup.com/v3/products';
const BARCODE_LOOKUP_API_KEY = 'mga8z30cl5vyrxl008nbkfexsi4lyp';

export default async function handler(req, res) {
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Get barcode from query parameters
  const { barcode } = req.query;

  // Validate barcode
  if (!barcode) {
    res.status(400).json({ error: 'Barcode parameter is required' });
    return;
  }

  // Validate barcode format (numeric, 8-14 digits)
  if (!/^\d{8,14}$/.test(barcode)) {
    res.status(400).json({ error: 'Invalid barcode format. Must be 8-14 digits.' });
    return;
  }

  try {
    // Construct API URL
    const apiUrl = `${BARCODE_LOOKUP_API_BASE_URL}?barcode=${barcode}&key=${BARCODE_LOOKUP_API_KEY}`;
    
    console.log(`[Proxy] Fetching from Barcode Lookup API: ${barcode}`);

    // Make request to Barcode Lookup API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    // Get response data
    const data = await response.json();

    // Return the API response with appropriate status code
    res.status(response.status).json(data);
  } catch (error) {
    console.error('[Proxy] Error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}

