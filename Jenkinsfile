pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
    }

    parameters {
        booleanParam(name: 'DEPLOY_LOCAL_CONTAINER', defaultValue: false,
                     description: 'Deploy the CloudPulse stack with Docker Compose')
    }

    environment {
        DOCKER_HUB_REPO = 'sandaruwanx/cloudpulse'
        IMAGE_TAG = "jenkins-${env.BUILD_NUMBER}"
        DOCKER_CONFIG = "${WORKSPACE}/.docker-ci"
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
                echo 'Executing the CloudPulse Node.js test suite...'
                dir('backend') {
                    bat 'npm ci'
                    bat 'npm test'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker image ${env.DOCKER_HUB_REPO}:${env.IMAGE_TAG}..."
                bat 'docker build -t %DOCKER_HUB_REPO%:%IMAGE_TAG% -t %DOCKER_HUB_REPO%:latest .'
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
                        $token = $env:DOCKER_PASS.Trim()
                        $username = $env:DOCKER_USER.Trim()
                        $token | docker login --username $username --password-stdin
                        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
                    '''
                    bat 'docker push %DOCKER_HUB_REPO%:%IMAGE_TAG%'
                    bat 'docker push %DOCKER_HUB_REPO%:latest'
                }
            }
        }

        stage('Deploy Local Stack') {
            when { expression { params.DEPLOY_LOCAL_CONTAINER } }
            steps {
                echo 'Deploying the CloudPulse Docker Compose stack...'
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
            echo 'Pipeline succeeded: tests passed and the CloudPulse image was published.'
        }
        failure {
            echo 'Pipeline failed. Check the first failing stage in the console output.'
        }
    }
}
