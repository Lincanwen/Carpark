import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// In-memory cache
interface CacheEntry {
  data: any;
  timestamp: number;
}
let carparkCache: CacheEntry | null = null;
const CACHE_TTL_MS = 45 * 1000; // 45 seconds

// Singapore Government Endpoints
const LTA_DATAMALL_URL = 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2';
const DATA_GOV_URL = 'https://api.data.gov.sg/v1/transport/carpark-availability';

/**
 * Fetch data from LTA DataMall API
 */
async function fetchLTADataMall(accountKey?: string) {
  const key = accountKey || process.env.LTA_DATAMALL_API_KEY;
  if (!key) {
    return {
      success: false,
      error: 'NO_KEY',
      message: 'No LTA DataMall AccountKey configured. Set LTA_DATAMALL_API_KEY in .env or pass AccountKey header.',
      data: [],
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(LTA_DATAMALL_URL, {
      signal: controller.signal,
      headers: {
        AccountKey: key,
        accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP_${response.status}`,
        message: `LTA DataMall responded with status ${response.status}`,
        data: [],
      };
    }

    const json: any = await response.json();
    return {
      success: true,
      data: json?.value || [],
      metadata: json?.['odata.metadata'] || '',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR',
      message: err.message || 'Failed to connect to LTA DataMall',
      data: [],
    };
  }
}

/**
 * Fetch data from Data.gov.sg Carpark Availability
 */
async function fetchDataGov() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(DATA_GOV_URL, {
      signal: controller.signal,
      headers: {
        accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Data.gov status: ${response.status}`);
    }

    const json: any = await response.json();
    return {
      success: true,
      timestamp: json?.items?.[0]?.timestamp || new Date().toISOString(),
      carparkData: json?.items?.[0]?.carpark_data || [],
    };
  } catch (err: any) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      carparkData: [],
      error: err.message,
    };
  }
}

// ================= API ROUTES =================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasLtaKey: Boolean(process.env.LTA_DATAMALL_API_KEY),
  });
});

/**
 * Unified Singapore Real-Time Carpark Availability Endpoint
 * Combines LTA DataMall (Shopping malls, CBD, Commercial) + Data.gov.sg (HDB, URA)
 */
app.get('/api/carpark/availability', async (req, res) => {
  const customKey = (req.headers['accountkey'] || req.headers['x-account-key'] || req.query.accountKey) as string;
  const now = Date.now();

  // Return cached result if valid and no custom key provided
  if (!customKey && carparkCache && now - carparkCache.timestamp < CACHE_TTL_MS) {
    return res.json({
      ...carparkCache.data,
      cached: true,
      cachedAgeSeconds: Math.round((now - carparkCache.timestamp) / 1000),
    });
  }

  // Parallel fetch from LTA DataMall and Data.gov.sg
  const [ltaResult, dataGovResult] = await Promise.all([
    fetchLTADataMall(customKey),
    fetchDataGov(),
  ]);

  const responsePayload = {
    success: true,
    timestamp: new Date().toISOString(),
    ltaStatus: {
      connected: ltaResult.success,
      recordCount: ltaResult.data.length,
      message: ltaResult.success
        ? `Successfully pulled ${ltaResult.data.length} records from LTA DataMall`
        : ltaResult.message,
    },
    dataGovStatus: {
      connected: dataGovResult.success,
      recordCount: dataGovResult.carparkData.length,
    },
    ltaData: ltaResult.data,
    dataGovData: dataGovResult.carparkData,
  };

  // Cache if successful
  if (!customKey) {
    carparkCache = {
      data: responsePayload,
      timestamp: now,
    };
  }

  res.json({
    ...responsePayload,
    cached: false,
  });
});

/**
 * Raw LTA DataMall CarParkAvailabilityv2 Endpoint
 */
app.get('/api/lta/raw', async (req, res) => {
  const customKey = (req.headers['accountkey'] || req.headers['x-account-key'] || req.query.accountKey) as string;
  const result = await fetchLTADataMall(customKey);
  res.json(result);
});

/**
 * Custom Endpoint Proxy (supports any custom LTA DataMall / Government URL provided)
 */
app.all('/api/lta/proxy', async (req, res) => {
  const targetUrl = (req.query.url as string) || (req.body?.url as string) || LTA_DATAMALL_URL;
  const key = (req.headers['accountkey'] || req.headers['x-account-key'] || req.query.accountKey || process.env.LTA_DATAMALL_API_KEY) as string;

  try {
    const response = await fetch(targetUrl, {
      method: req.method === 'GET' ? 'GET' : 'POST',
      headers: {
        ...(key ? { AccountKey: key } : {}),
        accept: 'application/json',
      },
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err: any) {
    res.status(502).json({
      error: 'PROXY_FAILED',
      targetUrl,
      message: err.message,
    });
  }
});

// ================= FRONTEND MOUNTING =================

async function startServer() {
  if (!isProduction) {
    // Development mode: Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Static file serving
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} (mode: ${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
