# CloudPulse

CloudPulse is a containerized web dashboard and Node.js API with health checks, system status, and Prometheus metrics. It includes Docker Compose monitoring and CI/CD pipelines using Jenkins and GitHub Actions.

## Built with

- Node.js 22 and Express
- HTML, CSS, and JavaScript
- Docker and Docker Compose
- Prometheus and Grafana
- Jenkins and GitHub Actions
- Node.js test runner

## Features

- Dashboard served by the backend
- Health check at `/health` and system status at `/api/status`
- Prometheus metrics at `/metrics`
- Endpoints to simulate traffic and errors for monitoring
- Automated tests, container image build, vulnerability scan, and Docker Hub publishing

## Run locally

1. Install Docker and Docker Compose.
2. Build and start CloudPulse:

   ```sh
   docker compose up --build -d
   ```

3. Open [http://localhost:5000](http://localhost:5000).

To run the tests directly with Node.js:

```sh
cd backend
npm ci
npm test
```

## Monitoring

Start Prometheus and Grafana from the `monitoring` directory:

```sh
cd monitoring
docker compose -f docker-compose.monitoring.yml up -d
```

- Grafana: [http://localhost:3000](http://localhost:3000) (default login: `admin` / `admin`)
- Prometheus: [http://localhost:9090](http://localhost:9090)
- Metrics endpoint: [http://localhost:5000/metrics](http://localhost:5000/metrics)

## CI/CD

- GitHub Actions runs backend tests on pushes and pull requests to `main`, builds and scans the Docker image, and publishes it to Docker Hub on pushes to `main`.
- Jenkins runs backend tests, builds the image, and pushes versioned and `latest` tags to Docker Hub. Local Docker Compose deployment is optional.
