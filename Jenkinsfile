pipeline {
    agent any
 
    environment {
        MONGO_URI = credentials('MONGO_URI')
        JWT_SECRET = credentials('JWT_SECRET')
        DATABASE_PORT = '5000'
        VITE_API_URL = 'http://34.204.195.105:5000/api'
    }

    options {
        // Stop the build if it takes longer than 15 minutes
        timeout(time: 15, unit: 'MINUTES')
        // Keep only the last 5 builds to save disk space on EC2
        buildDiscarder(logRotator(numToKeepStr: '5'))
    }

    stages {
        stage('Cleanup Workspace') {
            steps {
                // Ensures a fresh start by deleting old files from the previous build
                cleanWs()
            }
        }

        stage('Checkout SCM') {
            steps {
                // Pulls the code from the GitHub repository configured in the Job
                checkout scm
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                script {
                    echo "Starting Build and Deployment..."
                    // --build: Re-builds images if Dockerfile or code changed
                    // -d: Runs containers in the background (detached)
                    sh 'docker compose up -d --build'
                }
            }
        }

        stage('Verify Containers') {
            steps {
                // Simple check to see if the containers are actually running
                sh 'docker ps'
            }
        }

        stage('Cleanup Images') {
            steps {
                // Deletes 'dangling' images (old versions) to prevent the EC2 disk from filling up
                sh 'docker image prune -f'
            }
        }
    }

    post {
        success {
            echo "Deployment successful! Access your app at http://your-ec2-ip"
        }
        failure {
            echo "Deployment failed. Check the console output above for errors."
        }
    }
}