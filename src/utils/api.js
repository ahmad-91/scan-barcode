/**
 * API service for Barcode Lookup API (Primary) and Big Product Data API (Fallback)
 */

// Primary API - Barcode Lookup API (barcodelookup.com)
// Note: API calls are proxied through /api/barcode-lookup serverless function to avoid CORS issues

// Fallback API - RapidAPI Big Product Data API - using HTTPS as required
const API_BASE_URL = 'https://big-product-data.p.rapidapi.com';
// Secondary Fallback API - Barcodes Lookup API (RapidAPI)
const FALLBACK_API_BASE_URL = 'https://barcodes-lookup.p.rapidapi.com';
// Shorter timeout for mobile - don't wait too long
const REQUEST_TIMEOUT = 15000; // 15 seconds - shorter for better mobile experience

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
 * Fetch from Barcode Lookup API (Primary API) via Proxy
 * Uses Vercel serverless function to avoid CORS issues
 * Proxy endpoint: /api/barcode-lookup?barcode={barcode}
 */
const fetchFromBarcodeLookupAPI = async (barcode) => {
  // Use relative URL to proxy endpoint (works in both dev and production)
  const proxyEndpoint = `/api/barcode-lookup?barcode=${barcode}`;
  
  try {
    console.log(`[API] 🔍 Trying primary API (Barcode Lookup) via proxy: GET ${proxyEndpoint}`);
    
    const response = await fetchWithTimeout(
      proxyEndpoint,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-cache',
        mode: 'cors',
        credentials: 'omit',
      },
      REQUEST_TIMEOUT
    );

    if (response.ok) {
      const data = await response.json();
      console.log('[API] ✅ Barcode Lookup API response received via proxy');
      
      // Check if products array exists and has data
      if (data.products && Array.isArray(data.products) && data.products.length > 0) {
        const normalized = normalizeBarcodeLookupData(data.products[0], barcode);
        if (normalized && (normalized.name || normalized.product_name || normalized.image || normalized.brand)) {
          console.log('[API] ✅ Primary API provided useful data:', {
            name: normalized.name,
            image: !!normalized.image,
            brand: normalized.brand,
          });
          return normalized;
        }
      }
      
      // If products array is empty or no useful data
      console.warn('[API] ⚠️ Primary API response but no useful data extracted');
      return null;
    } else if (response.status === 404) {
      console.log('[API] ⚠️ Primary API returned 404 - product not found');
      return null;
    } else {
      const errorText = await response.text().catch(() => '');
      console.warn(`[API] ⚠️ Primary API returned ${response.status}:`, errorText.substring(0, 200));
      return null;
    }
  } catch (error) {
    console.error('[API] ❌ Primary API error:', error.message);
    return null;
  }
};

/**
 * Normalize Barcode Lookup API response
 * Response format: { products: [{ barcode_number, barcode_type, title, manufacturer, brand, model, ... }] }
 */
const normalizeBarcodeLookupData = (product, barcode) => {
  if (!product) return null;
  
  return {
    gtin: product.barcode_number || barcode,
    gtin13: product.barcode_number || barcode,
    gtin14: product.barcode_number || barcode,
    upc: product.barcode_number || barcode,
    name: product.title || product.product_name || product.name || null,
    product_name: product.title || product.product_name || product.name || null,
    title: product.title || product.product_name || product.name || null,
    brand: product.brand || product.manufacturer || null,
    manufacturer: product.manufacturer || product.brand || null,
    description: product.description || product.product_description || null,
    product_description: product.description || product.product_description || null,
    image: product.images && Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : product.image || product.image_url || null,
    product_image: product.images && Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : product.image || product.image_url || null,
    image_url: product.images && Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : product.image || product.image_url || null,
    price: product.price || product.price_amount || null,
    price_amount: product.price || product.price_amount || null,
    category: product.category || product.product_category || null,
    model: product.model || null,
    barcode_type: product.barcode_type || null,
    // Store additional data
    all_images: product.images || null,
    raw_data: product, // Store raw data for reference
  };
};

/**
 * Fetch product data by barcode (Primary: Barcode Lookup API, Fallback: RapidAPI)
 * Note: Tries Barcode Lookup API first, then falls back to RapidAPI if not found
 */
export const fetchProductByBarcode = async (barcode) => {
  // Validate barcode format (numeric, 8-14 digits typically)
  if (!/^\d{8,14}$/.test(barcode)) {
    throw new Error('Invalid barcode format. Please enter a valid GTIN/UPC/EAN (8-14 digits).');
  }

  // Step 1: Try Primary API - Barcode Lookup API
  console.log('[API] 🔍 Step 1: Trying Primary API (Barcode Lookup)...');
  try {
    const primaryData = await fetchFromBarcodeLookupAPI(barcode);
    if (primaryData && (primaryData.name || primaryData.product_name || primaryData.image || primaryData.brand)) {
      console.log('[API] ✅ Primary API (Barcode Lookup) returned data');
      // Add metadata about missing fields
      primaryData.missingFields = checkMissingFields(primaryData);
      primaryData.availableFields = checkAvailableFields(primaryData);
      primaryData.hasIncompleteData = primaryData.missingFields.length > 0;
      return primaryData;
    }
  } catch (primaryError) {
    console.warn('[API] ⚠️ Primary API (Barcode Lookup) failed:', primaryError.message);
  }

  // Step 2: Try First Fallback - RapidAPI Big Product Data API
  console.log('[API] 🔄 Step 2: Trying First Fallback (RapidAPI Big Product Data)...');
  try {
    const apiKey = getApiKey();
    const endpoint = `${API_BASE_URL}/gtin/${barcode}`;
    const headers = {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'big-product-data.p.rapidapi.com',
      'Accept': 'application/json',
    };

    const response = await fetchWithTimeout(
      endpoint,
      {
        method: 'GET',
        headers,
        cache: 'no-cache',
        mode: 'cors',
        credentials: 'omit',
        redirect: 'follow',
      },
      REQUEST_TIMEOUT
    );

    if (response.ok) {
      const data = await response.json();
      const normalizedData = normalizeProductData(data);
      
      if (normalizedData && (normalizedData.gtin || normalizedData.upc || normalizedData.name || normalizedData.product_name)) {
        console.log('[API] ✅ First Fallback (RapidAPI Big Product Data) returned data');
        normalizedData.missingFields = checkMissingFields(normalizedData);
        normalizedData.availableFields = checkAvailableFields(normalizedData);
        normalizedData.hasIncompleteData = normalizedData.missingFields.length > 0;
        return normalizedData;
      }
    }
  } catch (fallback1Error) {
    console.warn('[API] ⚠️ First Fallback (RapidAPI Big Product Data) failed:', fallback1Error.message);
  }

  // Step 3: Try Second Fallback - RapidAPI Barcodes Lookup API
  console.log('[API] 🔄 Step 3: Trying Second Fallback (RapidAPI Barcodes Lookup)...');
  try {
    const fallbackData = await fetchFromFallbackAPI(barcode);
    if (fallbackData && (fallbackData.name || fallbackData.product_name || fallbackData.image || fallbackData.manufacturer)) {
      console.log('[API] ✅ Second Fallback (RapidAPI Barcodes Lookup) returned data');
      fallbackData.missingFields = checkMissingFields(fallbackData);
      fallbackData.availableFields = checkAvailableFields(fallbackData);
      fallbackData.hasIncompleteData = fallbackData.missingFields.length > 0;
      return fallbackData;
    }
  } catch (fallback2Error) {
    console.warn('[API] ⚠️ Second Fallback (RapidAPI Barcodes Lookup) failed:', fallback2Error.message);
  }

  // All APIs failed
  console.error('[API] ❌ All APIs failed to find product data');
  throw new Error('لم يتم العثور على بيانات المنتج. يرجى المحاولة بباركود آخر.');
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

