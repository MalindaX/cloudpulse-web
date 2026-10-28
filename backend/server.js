const express = require('express');
const cors = require('cors');
const client = require('prom-client');
const os = require('os');

const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static frontend assets if available
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ==========================================
// 1. PROMETHEUS METRICS CONFIGURATION
// ==========================================
// Create a Registry which registers the metrics
const register = new client.Registry();

// Add default system metrics (CPU, Memory, Event Loop, etc.)
client.collectDefaultMetrics({
  register,
  prefix: 'cloudpulse_',
});

// Custom Metric 1: Total HTTP requests counter
const httpRequestCounter = new client.Counter({
  name: 'cloudpulse_http_requests_total',
  help: 'Total number of HTTP requests handled by CloudPulse',
  labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(httpRequestCounter);

// Custom Metric 2: Request duration histogram (for latency P95/P99)
const httpRequestDurationHistogram = new client.Histogram({
  name: 'cloudpulse_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});
register.registerMetric(httpRequestDurationHistogram);

// Middleware to track Prometheus metrics for every request
app.use((req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    const route = req.route ? req.route.path : req.path;

    httpRequestCounter.inc({
      method: req.method,
      route: route,
      status_code: res.statusCode,
    });

    httpRequestDurationHistogram.observe(
      {
        method: req.method,
        route: route,
        status_code: res.statusCode,
      },
      durationInSeconds
    );
  });

  next();
});

// ==========================================
// 2. APPLICATION ROUTES
// ==========================================

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    app: 'CloudPulse DevOps Service',
    version: '1.0.0',
    description: 'Lightweight service monitored with Prometheus and Grafana',
    endpoints: {
      health: '/health',
      metrics: '/metrics',
      status: '/api/status',
    },
  });
});

// Health Check Endpoint (used by Docker, Jenkins, K8s, AWS ALB)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    hostname: os.hostname(),
  });
});

// Prometheus Scrape Endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// System Status API
app.get('/api/status', (req, res) => {
  const memoryUsage = process.memoryUsage();
  res.json({
    status: 'healthy',
    hostname: os.hostname(),
    platform: os.platform(),
    release: os.release(),
    nodeVersion: process.version,
    uptimeSeconds: Math.floor(process.uptime()),
    memory: {
      rssMb: (memoryUsage.rss / 1024 / 1024).toFixed(2),
      heapTotalMb: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
      heapUsedMb: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
    },
    totalSystemMemoryGb: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2),
    freeSystemMemoryGb: (os.freemem() / 1024 / 1024 / 1024).toFixed(2),
  });
});

// Demo endpoint to generate traffic for Prometheus graphs
app.post('/api/simulate-traffic', (req, res) => {
  const count = req.body.count || 1;
  const delay = Math.floor(Math.random() * 80) + 20; // 20ms - 100ms
  setTimeout(() => {
    res.json({
      message: `Simulated traffic batch of ${count} processed successfully.`,
      processingDelayMs: delay,
      timestamp: new Date().toISOString(),
    });
  }, delay);
});

// Demo endpoint to simulate error 500 (to test alerts in Prometheus/Grafana)
app.get('/api/simulate-error', (req, res) => {
  res.status(500).json({
    error: 'Internal Server Error simulation for monitoring testing',
    timestamp: new Date().toISOString(),
  });
});

// Start server if not imported by test runner
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[CloudPulse Server] Running on http://localhost:${PORT}`);
    console.log(`[CloudPulse Server] Metrics available on http://localhost:${PORT}/metrics`);
    console.log(`[CloudPulse Server] Health check on http://localhost:${PORT}/health`);
  });
}

module.exports = app;
