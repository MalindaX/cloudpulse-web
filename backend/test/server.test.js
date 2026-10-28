const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../server');

test('CloudPulse Backend Test Suite', async (t) => {
  let server;
  const testPort = 5099;

  // Start test server instance
  await new Promise((resolve) => {
    server = app.listen(testPort, () => resolve());
  });

  t.after(() => {
    server.close();
  });

  await t.test('GET /health returns 200 and UP status', async () => {
    const res = await fetch(`http://localhost:${testPort}/health`);
    assert.strictEqual(res.status, 200);

    const data = await res.json();
    assert.strictEqual(data.status, 'UP');
    assert.ok(typeof data.uptime === 'number');
  });

  await t.test('GET /api/status returns system health info', async () => {
    const res = await fetch(`http://localhost:${testPort}/api/status`);
    assert.strictEqual(res.status, 200);

    const data = await res.json();
    assert.strictEqual(data.status, 'healthy');
    assert.ok(data.hostname);
    assert.ok(data.memory);
  });

  await t.test('GET /metrics returns Prometheus formatted metrics', async () => {
    const res = await fetch(`http://localhost:${testPort}/metrics`);
    assert.strictEqual(res.status, 200);

    const text = await res.text();
    assert.ok(text.includes('cloudpulse_http_requests_total') || text.includes('process_cpu'));
  });
});
