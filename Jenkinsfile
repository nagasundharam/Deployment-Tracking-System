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
        stage('Initialize Tracker') {
            steps {
                script {
                    // Extract Git Metadata
                    env.COMMIT_HASH = sh(script: "git rev-parse HEAD", returnStdout: true).trim()
                    env.COMMIT_MSG = sh(script: "git log -1 --pretty=%B", returnStdout: true).trim()
                    env.COMMIT_AUTHOR = sh(script: "git log -1 --pretty=%an", returnStdout: true).trim()
                    env.COMMIT_AUTHOR_EMAIL = sh(script: "git log -1 --pretty=%ae", returnStdout: true).trim()
                    
                    // Initial notification to create the record
                    def initialPayload = """
                    {
                        "project_id": "69ce6897557b3606c5b165ec",
                        "environment_id": "69ce68b3557b3606c5b165fb",
                        "pipeline_id": "${env.BUILD_NUMBER}",
                        "version": "1.0.${env.BUILD_NUMBER}",
                        "branch": "main",
                        "triggered_by": { "source": "jenkins", "username": "${env.COMMIT_AUTHOR}" },
                        "commit_message": \"\"\"${env.COMMIT_MSG}\"\"\",
                        "commit_author": "${env.COMMIT_AUTHOR}",
                        "commit_author_email": "${env.COMMIT_AUTHOR_EMAIL}",
                        "commit_hash": "${env.COMMIT_HASH}"
                    }
                    """
                    writeFile file: 'initial_payload.json', text: initialPayload
                    def response = sh(script: "curl -s -X POST ${env.VITE_API_URL}/jenkins-webhook -H 'Content-Type: application/json' -d @initial_payload.json", returnStdout: true)
                    
                    // Parse response to get the Deployment ID (using sh/grep/sed as fallback to readJSON)
                    env.DEPLOYMENT_ID = sh(script: "echo '${response}' | grep -oP '\"_id\":\"\\K[^\"]+' | head -1", returnStdout: true).trim()
                    echo "Tracker Initialized. Deployment ID: ${env.DEPLOYMENT_ID}"
                }
            }
        }

        stage('Checkout SCM') {
            steps {
                checkout scm
                script { notifyStage("Checkout SCM", "success") }
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                script {
                    echo "Starting Build and Deployment..."
                    sh 'docker compose up -d --build'
                    notifyStage("Deploy with Docker Compose", "success")
                }
            }
        }

        stage('Manual Approval') {
            steps {
                script {
                    // Update status to pending_approval in Tracker
                    sh "curl -s -X PATCH ${env.VITE_API_URL}/deployments/${env.DEPLOYMENT_ID}/status -H 'Content-Type: application/json' -d '{\"status\": \"pending\"}'"
                    
                    echo "--- AWAITING APPROVAL ---"
                    input message: "Approve deployment to Environment?", ok: "Proceed"
                    
                    sh "curl -s -X PATCH ${env.VITE_API_URL}/deployments/${env.DEPLOYMENT_ID}/status -H 'Content-Type: application/json' -d '{\"status\": \"approved\"}'"
                }
            }
        }

        stage('Verify Containers') {
            steps {
                script {
                    sh 'docker ps'
                    notifyStage("Verify Containers", "success")
                }
            }
        }

        stage('Cleanup Images') {
            steps {
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