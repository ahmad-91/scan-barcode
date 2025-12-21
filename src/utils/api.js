/**
 * API service for Big Product Data API
 */

// RapidAPI Big Product Data API - using HTTPS as required
const API_BASE_URL = 'https://big-product-data.p.rapidapi.com';
// Fallback API - Barcodes Lookup API
const FALLBACK_API_BASE_URL = 'https://barcodes-lookup.p.rapidapi.com';
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
          
          // If critical data is missing (name or image), try fallback API
          if (missingFields.includes('اسم المنتج') || missingFields.includes('صورة المنتج')) {
            console.log('[API] 🔄 Trying fallback API for missing data...');
            try {
              const fallbackData = await fetchFromFallbackAPI(barcode);
              if (fallbackData) {
                // Merge fallback data with existing data
                const mergedData = mergeProductData(normalizedData, fallbackData);
                mergedData.missingFields = checkMissingFields(mergedData);
                mergedData.availableFields = checkAvailableFields(mergedData);
                mergedData.hasIncompleteData = mergedData.missingFields.length > 0;
                return mergedData;
              }
            } catch (fallbackError) {
              console.warn('[API] Fallback API failed:', fallbackError.message);
              // Continue with original data
            }
          }
        }
        
        return normalizedData;
      } else {
        // No data at all, try fallback API
        console.log('[API] 🔄 No data from primary API, trying fallback API...');
        const fallbackData = await fetchFromFallbackAPI(barcode);
        if (fallbackData && (fallbackData.name || fallbackData.product_name || fallbackData.image || fallbackData.manufacturer)) {
          console.log('[API] ✅ Fallback API provided data when primary API had none');
          return fallbackData;
        }
        
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
 * Fetch from fallback API (Barcodes Lookup API)
 * API: https://rapidapi.com/UnlimitedAPI/api/barcodes-lookup
 */
/**
 * Fetch from fallback API (Barcodes Lookup API)
 * API: https://rapidapi.com/UnlimitedAPI/api/barcodes-lookup
 * Endpoint: GET /?barcode={barcode}
 */
const fetchFromFallbackAPI = async (barcode) => {
  const apiKey = getApiKey();
  
  // Correct endpoint: GET /?barcode={barcode}
  const endpoint = `${FALLBACK_API_BASE_URL}/?barcode=${barcode}`;
  
  const headers = {
    'X-RapidAPI-Key': apiKey,
    'X-RapidAPI-Host': 'barcodes-lookup.p.rapidapi.com',
    'Accept': 'application/json',
  };

  try {
    console.log(`[API] 🔄 Trying fallback API: GET ${endpoint}`);
    
    const response = await fetchWithTimeout(
      endpoint,
      {
        method: 'GET',
        headers,
        cache: 'no-cache',
        mode: 'cors',
        credentials: 'omit',
      },
      REQUEST_TIMEOUT
    );

    if (response.ok) {
      const data = await response.json();
      console.log('[API] ✅ Fallback API response received');
      console.log('[API] Response structure:', data.product ? 'Has product object' : 'No product object');
      
      // Normalize fallback API response
      const normalized = normalizeFallbackData(data, barcode);
      if (normalized && (normalized.name || normalized.product_name || normalized.image || normalized.manufacturer)) {
        console.log('[API] ✅ Fallback API provided useful data:', {
          name: normalized.name,
          image: !!normalized.image,
          manufacturer: normalized.manufacturer,
        });
        return normalized;
      } else {
        console.warn('[API] ⚠️ Fallback API response but no useful data extracted');
        return null;
      }
    } else {
      const errorText = await response.text().catch(() => '');
      console.warn(`[API] ⚠️ Fallback API returned ${response.status}:`, errorText.substring(0, 200));
      return null;
    }
  } catch (error) {
    console.error('[API] ❌ Fallback API error:', error.message);
    return null;
  }
};

/**
 * Normalize fallback API response (Barcodes Lookup API)
 * Response format:
 * {
 *   "product": {
 *     "title": "Product Name",
 *     "manufacturer": "Brand Name",
 *     "brand": "Brand Name",
 *     "description": "Description",
 *     "images": ["url1", "url2", ...],
 *     "online_stores": [{"name": "Amazon", "price": "$124.39", "url": "..."}],
 *     "category": "Category",
 *     "features": ["feature1", "feature2", ...]
 *   }
 * }
 */
const normalizeFallbackData = (data, barcode) => {
  if (!data) return null;
  
  // Handle different response structures from barcodes-lookup API
  const product = data.product || data.data || data;
  
  if (!product) return null;
  
  // Extract price from online_stores
  let price = null;
  if (product.online_stores && Array.isArray(product.online_stores) && product.online_stores.length > 0) {
    const firstStore = product.online_stores[0];
    price = firstStore.price || null;
  }
  
  // Extract first image from images array
  const image = product.images && Array.isArray(product.images) && product.images.length > 0
    ? product.images[0]
    : null;
  
  // Use features as description if description is missing
  let description = product.description;
  if (!description && product.features && Array.isArray(product.features) && product.features.length > 0) {
    description = product.features.join('. ');
  }
  
  return {
    gtin: barcode,
    gtin13: barcode,
    gtin14: barcode,
    upc: barcode,
    name: product.title || product.name || product.product_name || null,
    product_name: product.title || product.name || product.product_name || null,
    title: product.title || product.name || product.product_name || null,
    brand: product.brand || product.manufacturer || null,
    manufacturer: product.manufacturer || product.brand || null,
    description: description || product.product_description || null,
    product_description: description || product.product_description || null,
    image: image || product.image || product.image_url || null,
    product_image: image || product.image || product.image_url || null,
    image_url: image || product.image || product.image_url || null,
    price: price || product.price || product.price_amount || null,
    price_amount: price || product.price || product.price_amount || null,
    category: product.category || product.product_category || null,
    // Store additional data
    features: product.features || null,
    attributes: product.attributes || null,
    online_stores: product.online_stores || null,
    all_images: product.images || null, // Store all images for potential use
  };
};

/**
 * Merge product data from two sources
 */
const mergeProductData = (primary, fallback) => {
  return {
    ...primary,
    // Use fallback data only if primary is missing
    name: primary.name || fallback.name || null,
    product_name: primary.product_name || fallback.product_name || null,
    title: primary.title || fallback.title || null,
    brand: primary.brand || fallback.brand || null,
    manufacturer: primary.manufacturer || fallback.manufacturer || null,
    description: primary.description || fallback.description || null,
    product_description: primary.product_description || fallback.product_description || null,
    image: primary.image || fallback.image || null,
    product_image: primary.product_image || fallback.product_image || null,
    image_url: primary.image_url || fallback.image_url || null,
    price: primary.price || fallback.price || null,
    price_amount: primary.price_amount || fallback.price_amount || null,
    category: primary.category || fallback.category || null,
  };
};

/**
 * Check missing fields
 */
const checkMissingFields = (data) => {
  const missing = [];
  if (!data.name && !data.product_name && !data.title) missing.push('اسم المنتج');
  if (!data.image && !data.product_image && !data.image_url) missing.push('صورة المنتج');
  if (!data.brand && !data.manufacturer) missing.push('العلامة التجارية');
  if (!data.description && !data.product_description) missing.push('الوصف');
  if (!data.price && !data.price_amount) missing.push('السعر');
  return missing;
};

/**
 * Check available fields
 */
const checkAvailableFields = (data) => {
  const available = [];
  if (data.name || data.product_name || data.title) available.push('اسم المنتج');
  if (data.image || data.product_image || data.image_url) available.push('صورة المنتج');
  if (data.brand || data.manufacturer) available.push('العلامة التجارية');
  if (data.description || data.product_description) available.push('الوصف');
  if (data.price || data.price_amount) available.push('السعر');
  return available;
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

