pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
    }

    environment {
        REGISTRY_USER = 'sandaruwanx'
        IMAGE_NAME = "${REGISTRY_USER}/cloudpulse"
        IMAGE_TAG = "jenkins-${env.BUILD_NUMBER}"
        DOCKER_CONFIG = "${WORKSPACE}\\.docker-ci"
    }

    stages {
        stage('Checkout Source') {
            steps {
                echo 'Checking out code from Git...'
                checkout scm
            }
        }

        stage('Automated Tests') {
            steps {
                echo 'Executing Node.js automated test suite...'
                dir('backend') {
                    bat 'npm ci'
                    bat 'npm test'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker image: ${IMAGE_NAME}:${IMAGE_TAG}"
                bat 'docker build -t %IMAGE_NAME%:%IMAGE_TAG% -t %IMAGE_NAME%:latest .'
            }
        }

       stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    powershell '''
                        $token = "$env:DOCKER_PASS".Trim()
                        $token | docker login --username "$env:DOCKER_USER".Trim() --password-stdin
                        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
                    '''
                    bat 'docker push %DOCKER_HUB_REPO%:%IMAGE_TAG%'
                    bat 'docker push %DOCKER_HUB_REPO%:latest'
                }
            }
        }

        stage('Deploy Local Stack') {
            steps {
                echo 'Deploying containerized application with Docker Compose...'
                bat 'docker compose up -d --build'
            }
        }
    }

    post {
        always {
            powershell '''
                docker logout
                if (Test-Path $env:DOCKER_CONFIG) {
                    Remove-Item -Recurse -Force $env:DOCKER_CONFIG
                }
            '''
        }
        success {
            echo 'Pipeline succeeded: App tested, container built, pushed, and deployed.'
        }
        failure {
            echo 'Pipeline failed. Check stage logs for details.'
        }
    }
}
