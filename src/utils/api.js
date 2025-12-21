/**
 * API service for Big Product Data API
 */

// RapidAPI Big Product Data API - using HTTPS as required
const API_BASE_URL = 'https://big-product-data.p.rapidapi.com';
// RapidAPI gateway timeout is 180 seconds by default
// Using 60 seconds for browser requests to allow for slow API responses
const REQUEST_TIMEOUT = 60000; // 60 seconds

/**
 * Get API key from environment variables
 */
const getApiKey = () => {
  const apiKey = process.env.REACT_APP_RAPIDAPI_KEY;
  if (!apiKey) {
    throw new Error('API key not configured. Please set REACT_APP_RAPIDAPI_KEY in environment variables.');
  }
  return apiKey;
};

/**
 * Create a fetch request with timeout and abort controller
 */
const fetchWithTimeout = (url, options, timeout = REQUEST_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  return fetch(url, {
    ...options,
    signal: controller.signal,
  })
    .then((response) => {
      clearTimeout(timeoutId);
      return response;
    })
    .catch((error) => {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    });
};

/**
 * Test RapidAPI connection from localhost WITHOUT timeout
 * Use this to test if the API actually responds (may take a while)
 */
export const testRapidAPIConnectionNoTimeout = async () => {
  const apiKey = getApiKey();
  const testEndpoint = `${API_BASE_URL}/gtin/850028009338`; // Known test barcode
  
  const headers = {
    'X-RapidAPI-Key': apiKey,
    'X-RapidAPI-Host': 'big-product-data.p.rapidapi.com',
    'Accept': 'application/json',
  };

  try {
    console.log('[API] Testing RapidAPI connection WITHOUT timeout...');
    console.log('[API] This may take up to 3 minutes...');
    console.log('[API] Origin:', window.location.origin);
    const startTime = Date.now();
    
    // Test WITHOUT timeout to see if API actually responds
    const response = await fetch(testEndpoint, {
      method: 'GET',
      headers,
      mode: 'cors',
      credentials: 'omit',
    });

    const duration = Date.now() - startTime;
    console.log(`[API] Connection test completed in ${duration}ms (${(duration / 1000).toFixed(2)} seconds)`);
    console.log(`[API] Response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('[API] ✅ RapidAPI connection successful!');
      console.log('[API] Sample data:', data);
      return { success: true, duration, status: response.status, data };
    } else {
      const errorText = await response.text().catch(() => '');
      console.warn(`[API] ⚠️ RapidAPI returned status ${response.status}:`, errorText);
      return { success: false, duration, status: response.status, error: errorText };
    }
  } catch (error) {
    console.error('[API] ❌ RapidAPI connection test failed:', error);
    console.error('[API] Error type:', error.name);
    console.error('[API] Error message:', error.message);
    return { success: false, error: error.message, errorType: error.name };
  }
};

/**
 * Test RapidAPI connection from localhost
 * RapidAPI supports requests from localhost - CORS is handled automatically
 */
export const testRapidAPIConnection = async () => {
  const apiKey = getApiKey();
  const testEndpoint = `${API_BASE_URL}/gtin/850028009338`; // Known test barcode
  
  const headers = {
    'X-RapidAPI-Key': apiKey,
    'X-RapidAPI-Host': 'big-product-data.p.rapidapi.com',
    'Accept': 'application/json',
  };

  try {
    console.log('[API] Testing RapidAPI connection from localhost...');
    console.log('[API] Origin:', window.location.origin);
    console.log('[API] Timeout:', REQUEST_TIMEOUT, 'ms');
    const startTime = Date.now();
    
    const response = await fetchWithTimeout(testEndpoint, {
      method: 'GET',
      headers,
      mode: 'cors',
      credentials: 'omit',
    }, REQUEST_TIMEOUT);

    const duration = Date.now() - startTime;
    console.log(`[API] Connection test completed in ${duration}ms`);
    console.log(`[API] Response status: ${response.status}`);
    
    if (response.ok) {
      console.log('[API] ✅ RapidAPI connection successful from localhost');
      return { success: true, duration, status: response.status };
    } else {
      const errorText = await response.text().catch(() => '');
      console.warn(`[API] ⚠️ RapidAPI returned status ${response.status}:`, errorText);
      return { success: false, duration, status: response.status, error: errorText };
    }
  } catch (error) {
    console.error('[API] ❌ RapidAPI connection test failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch product data by barcode with retry mechanism
 * Note: RapidAPI supports requests from localhost - CORS is handled automatically
 */
export const fetchProductByBarcode = async (barcode, retries = 2) => {
  const apiKey = getApiKey();
  
  // Validate barcode format (numeric, 8-14 digits typically)
  if (!/^\d{8,14}$/.test(barcode)) {
    throw new Error('Invalid barcode format. Please enter a valid GTIN/UPC/EAN (8-14 digits).');
  }

  // RapidAPI required headers - all requests must use HTTPS
  // RapidAPI automatically handles CORS for localhost requests
  const headers = {
    'X-RapidAPI-Key': apiKey,
    'X-RapidAPI-Host': 'big-product-data.p.rapidapi.com',
    'Accept': 'application/json',
  };

  // Correct endpoint format based on RapidAPI Big Product Data API documentation
  // The correct endpoint is: /gtin/{barcode}
  const endpoint = `${API_BASE_URL}/gtin/${barcode}`;

  let lastError = null;
  
  // Retry logic for transient failures
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[API] Retry attempt ${attempt} of ${retries}`);
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
      
      console.log(`[API] Making HTTPS GET request to: ${endpoint}`);
      console.log(`[API] Timeout set to: ${REQUEST_TIMEOUT}ms (${REQUEST_TIMEOUT / 1000} seconds)`);
      console.log(`[API] Request origin: ${window.location.origin}`);
      console.log(`[API] RapidAPI supports localhost requests - CORS handled automatically`);
      
      const requestStartTime = Date.now();
    
      // Make HTTPS GET request to RapidAPI
      // RapidAPI automatically handles CORS for localhost requests
      // All RapidAPI endpoints support requests from any origin including localhost
      const response = await fetchWithTimeout(
        endpoint,
        {
          method: 'GET',
          headers,
          cache: 'no-cache',
          mode: 'cors', // CORS mode - RapidAPI supports this
          credentials: 'omit', // Don't send cookies
          redirect: 'follow',
        },
        REQUEST_TIMEOUT
      );

      const requestDuration = Date.now() - requestStartTime;
      console.log(`[API] Request completed in ${requestDuration}ms`);

    console.log(`[API] Response status: ${response.status}`);
    console.log(`[API] Response headers:`, Object.fromEntries(response.headers.entries()));

    // Check if response is ok
    if (response.ok) {
      let data;
      try {
        // Check content type
        const contentType = response.headers.get('content-type');
        console.log(`[API] Content-Type: ${contentType}`);
        
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          // Try to parse as JSON anyway
          const text = await response.text();
          if (!text) {
            throw new Error('Empty response from API');
          }
          console.log(`[API] Response text (first 200 chars):`, text.substring(0, 200));
          data = JSON.parse(text);
        }
        
        console.log(`[API] Successfully parsed response data`);
      } catch (parseError) {
        console.error('[API] Failed to parse API response:', parseError);
        const errorText = await response.text().catch(() => 'Unable to read error response');
        console.error('[API] Response text:', errorText.substring(0, 500));
        throw new Error(`Invalid response format from API: ${parseError.message}`);
      }

      const normalizedData = normalizeProductData(data);
      console.log(`[API] Normalized product data:`, {
        name: normalizedData.name,
        gtin: normalizedData.gtin,
        hasImage: !!normalizedData.image
      });
      
      // Check what data is available and what's missing
      const missingFields = [];
      const availableFields = [];
      
      if (!normalizedData.name && !normalizedData.product_name && !normalizedData.title) {
        missingFields.push('اسم المنتج');
      } else {
        availableFields.push('اسم المنتج');
      }
      
      if (!normalizedData.image && !normalizedData.product_image && !normalizedData.image_url) {
        missingFields.push('صورة المنتج');
      } else {
        availableFields.push('صورة المنتج');
      }
      
      if (!normalizedData.brand && !normalizedData.manufacturer) {
        missingFields.push('العلامة التجارية');
      } else {
        availableFields.push('العلامة التجارية');
      }
      
      if (!normalizedData.description && !normalizedData.product_description) {
        missingFields.push('الوصف');
      } else {
        availableFields.push('الوصف');
      }
      
      if (!normalizedData.price && !normalizedData.price_amount) {
        missingFields.push('السعر');
      } else {
        availableFields.push('السعر');
      }
      
      // Always return data if we have at least GTIN or some product info
      if (normalizedData && (normalizedData.gtin || normalizedData.upc || normalizedData.name || normalizedData.product_name)) {
        // Add metadata about missing fields
        normalizedData.missingFields = missingFields;
        normalizedData.availableFields = availableFields;
        normalizedData.hasIncompleteData = missingFields.length > 0;
        
        if (missingFields.length > 0) {
          console.warn(`[API] ⚠️ Product data is incomplete. Missing: ${missingFields.join(', ')}`);
          console.log(`[API] ✅ Available fields: ${availableFields.join(', ')}`);
        }
        
        return normalizedData;
      } else {
        throw new Error('لم يتم العثور على بيانات المنتج. يرجى المحاولة بباركود آخر.');
      }
    }

    // Handle HTTP errors
    if (response.status === 404) {
      throw new Error('Product not found. Please try another barcode.');
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error('Invalid API key. Please check your RapidAPI key configuration.');
    }

    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    if (response.status >= 500) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    // For other errors
    const errorText = await response.text().catch(() => '');
    throw new Error(`API Error: ${response.status} ${response.statusText}. ${errorText}`);
    } catch (error) {
      console.error(`[API] Request error on attempt ${attempt + 1}:`, error);
      
      // Don't retry for these errors
      if (error.message.includes('API key') || 
          error.message.includes('Rate limit') ||
          error.message.includes('Product not found') ||
          error.message.includes('404') ||
          error.message.includes('401') ||
          error.message.includes('403')) {
        throw error;
      }

      // If it's a timeout/network error and we have retries left, try again
      if ((error.message === 'Request timeout' || error.name === 'AbortError' ||
           (error.name === 'TypeError' && error.message.includes('fetch'))) && 
          attempt < retries) {
        console.warn(`[API] Retryable error on attempt ${attempt + 1}, will retry...`);
        lastError = error;
        continue;
      }

      // For server errors (5xx), retry if we have attempts left
      if (error.message.includes('Server error: 5') && attempt < retries) {
        console.warn(`[API] Server error on attempt ${attempt + 1}, will retry...`);
        lastError = error;
        continue;
      }

      // If this was the last attempt, format and throw the error
      if (attempt === retries) {
        if (error.message === 'Request timeout' || error.name === 'AbortError') {
          console.error('[API] Request timed out after', REQUEST_TIMEOUT, 'ms (', REQUEST_TIMEOUT / 1000, 'seconds) and', retries, 'retries');
          console.error('[API] This suggests the API is taking longer than', REQUEST_TIMEOUT / 1000, 'seconds to respond');
          console.error('[API] Try checking:');
          console.error('[API] 1. Browser Network tab (F12) to see if request is pending');
          console.error('[API] 2. RapidAPI dashboard to check API status');
          console.error('[API] 3. Your internet connection speed');
          throw new Error(`Request timed out after ${REQUEST_TIMEOUT / 1000} seconds. The API is taking too long to respond.\n\nPossible causes:\n- Slow network connection\n- API server processing delay\n- High API load\n- Firewall/proxy blocking the request\n\nCheck browser console (F12) for more details.`);
        }
        
        if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
          console.error('[API] Network fetch error');
          console.error('[API] This could be:\n- Network connectivity issue\n- CORS error (unlikely with RapidAPI)\n- Firewall/proxy blocking the request\n- Browser security settings');
          throw new Error('Network error. RapidAPI supports localhost requests, so this might be:\n- Internet connection issue\n- Firewall/proxy blocking requests\n- Browser security settings\n\nCheck browser console (F12) for detailed error messages.');
        }

        if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
          throw new Error('CORS error. Please check your browser console for details.');
        }

        throw error;
      }

      // Store error for potential retry
      lastError = error;
    }
  }
  
  // This should never be reached, but just in case
  if (lastError) {
    throw lastError;
  }
};

/**
 * Normalize product data from RapidAPI Big Product Data API response structure
 * Response format:
 * {
 *   "gtin": "850028009338",
 *   "properties": {
 *     "title": ["Product Name 1", "Product Name 2", ...],
 *     "brand": ["Brand Name"],
 *     "description": ["Description text"],
 *     "manufacturer": ["Manufacturer"],
 *     ...
 *   },
 *   "stores": [
 *     {
 *       "store": "Store Name",
 *       "image": "https://...",
 *       "url": "https://...",
 *       "price": { "currency": "USD", "price": "33.95" }
 *     }
 *   ]
 * }
 */
const normalizeProductData = (data) => {
  // Handle null or undefined
  if (!data) {
    throw new Error('No product data received from API.');
  }

  // Handle the actual API response structure
  if (data.gtin && data.properties) {
    const normalized = {
      gtin: data.gtin,
      gtin13: data.gtin,
      gtin14: data.gtin,
      upc: data.gtin,
      // Extract first title as product name
      name: data.properties.title && Array.isArray(data.properties.title) && data.properties.title.length > 0
        ? data.properties.title[0]
        : null,
      product_name: data.properties.title && Array.isArray(data.properties.title) && data.properties.title.length > 0
        ? data.properties.title[0]
        : null,
      title: data.properties.title && Array.isArray(data.properties.title) && data.properties.title.length > 0
        ? data.properties.title[0]
        : null,
      // Extract brand
      brand: data.properties.brand && Array.isArray(data.properties.brand) && data.properties.brand.length > 0
        ? data.properties.brand[0]
        : null,
      manufacturer: data.properties.manufacturer && Array.isArray(data.properties.manufacturer) && data.properties.manufacturer.length > 0
        ? data.properties.manufacturer[0]
        : null,
      // Extract description (use first one)
      description: data.properties.description && Array.isArray(data.properties.description) && data.properties.description.length > 0
        ? data.properties.description[0]
        : null,
      product_description: data.properties.description && Array.isArray(data.properties.description) && data.properties.description.length > 0
        ? data.properties.description[0]
        : null,
      // Extract image from first store
      image: data.stores && Array.isArray(data.stores) && data.stores.length > 0 && data.stores[0].image
        ? data.stores[0].image
        : null,
      product_image: data.stores && Array.isArray(data.stores) && data.stores.length > 0 && data.stores[0].image
        ? data.stores[0].image
        : null,
      image_url: data.stores && Array.isArray(data.stores) && data.stores.length > 0 && data.stores[0].image
        ? data.stores[0].image
        : null,
      // Extract price from first store
      price: data.stores && Array.isArray(data.stores) && data.stores.length > 0 && data.stores[0].price
        ? data.stores[0].price.price || data.stores[0].price.sale || data.stores[0].price.list
        : null,
      price_amount: data.stores && Array.isArray(data.stores) && data.stores.length > 0 && data.stores[0].price
        ? data.stores[0].price.price || data.stores[0].price.sale || data.stores[0].price.list
        : null,
      // Store additional properties
      properties: data.properties,
      stores: data.stores,
      // Store all titles for reference
      titles: data.properties.title || [],
    };

    return normalized;
  }

  // Fallback: Handle array responses
  if (Array.isArray(data)) {
    if (data.length === 0) {
      throw new Error('Product not found.');
    }
    // Try to normalize first item
    return normalizeProductData(data[0]);
  }

  // Fallback: Handle nested structures
  if (data.product) {
    return normalizeProductData(data.product);
  }

  if (data.data) {
    return normalizeProductData(Array.isArray(data.data) ? data.data[0] : data.data);
  }

  if (data.result) {
    return normalizeProductData(Array.isArray(data.result) ? data.result[0] : data.result);
  }

  // Return data as-is if structure is unknown
  return data;
};

