# CloudPulse

> **Hybrid Cloud CI/CD & Observability Platform**  
> Built for Entry-Level & Associate DevOps Engineers with **Docker, Jenkins, GitHub Actions, AWS (EC2/ECR), ngrok Webhooks, Prometheus, and Grafana**.

---

## Quick Start (Running Locally)

```powershell
# 1. Install & test backend
cd backend
npm ci
npm test

# 2. Run backend & frontend
npm start
# App dashboard: http://localhost:5000
# Health probe:  http://localhost:5000/health
# Prometheus:    http://localhost:5000/metrics

# 3. Run Prometheus & Grafana Monitoring Stack
cd ../monitoring
docker compose -f docker-compose.monitoring.yml up -d
# Prometheus: http://localhost:9090
# Grafana:    http://localhost:3000 (admin / admin)
```


