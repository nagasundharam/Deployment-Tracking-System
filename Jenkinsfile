pipeline {
    agent any
 
    environment {
        MONGO_URI = credentials('MONGO_URI')
        JWT_SECRET = credentials('JWT_SECRET')
        DATABASE_PORT = '5000'
        VITE_API_URL = 'http://34.204.195.105:5000/api'
    }

    options {
        timeout(time: 15, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '5'))
    }

    stages {
        stage('Initialize Tracker') {
            steps {
                script {
                    echo "Extracting Git Metadata..."
                    env.COMMIT_HASH = sh(script: "git rev-parse HEAD", returnStdout: true).trim()
                    env.COMMIT_MSG = sh(script: "git log -1 --pretty=%B", returnStdout: true).trim()
                    env.COMMIT_AUTHOR = sh(script: "git log -1 --pretty=%an", returnStdout: true).trim()
                    env.COMMIT_AUTHOR_EMAIL = sh(script: "git log -1 --pretty=%ae", returnStdout: true).trim()
                    
                    // Safely escape metadata for JSON
                    def safeMsg = env.COMMIT_MSG.replace('"', '\\"').replace('\n', '\\n').replace('\r', '\\r')
                    def safeAuthor = env.COMMIT_AUTHOR.replace('"', '\\"')

                    echo "Initializing Deployment Record in Tracker..."
                    def initialPayload = """
                    {
                        "project_id": "69ce6897557b3606c5b165ec",
                        "environment_id": "69ce68b3557b3606c5b165fb",
                        "pipeline_id": "${env.BUILD_NUMBER}",
                        "version": "1.0.${env.BUILD_NUMBER}",
                        "branch": "main",
                        "triggered_by": { "source": "jenkins", "username": "${safeAuthor}" },
                        "commit_message": "${safeMsg}",
                        "commit_author": "${safeAuthor}",
                        "commit_author_email": "${env.COMMIT_AUTHOR_EMAIL}",
                        "commit_hash": "${env.COMMIT_HASH}"
                    }
                    """
                    writeFile file: 'initial_payload.json', text: initialPayload
                    
                    def response = sh(script: "curl -s -X POST ${env.VITE_API_URL}/jenkins-webhook -H 'Content-Type: application/json' -d @initial_payload.json", returnStdout: true)
                    
                    // Use grep as a robust fallback for parsing the ID from the JSON response
                    env.DEPLOYMENT_ID = sh(script: "echo '${response}' | grep -oP '\"_id\":\"\\K[^\"]+' | head -1", returnStdout: true).trim()
                    
                    if (!env.DEPLOYMENT_ID) {
                        echo "WARNING: Failed to capture DEPLOYMENT_ID from tracker. Response was: ${response}"
                    } else {
                        echo "Tracker Initialized. Deployment ID: ${env.DEPLOYMENT_ID}"
                    }
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
                    if (env.DEPLOYMENT_ID) {
                        sh "curl -s -X PATCH ${env.VITE_API_URL}/deployments/${env.DEPLOYMENT_ID}/status -H 'Content-Type: application/json' -d '{\"status\": \"pending\"}'"
                    }
                    
                    echo "--- AWAITING APPROVAL ---"
                    input message: "Approve deployment to Environment?", ok: "Proceed"
                    
                    if (env.DEPLOYMENT_ID) {
                        sh "curl -s -X PATCH ${env.VITE_API_URL}/deployments/${env.DEPLOYMENT_ID}/status -H 'Content-Type: application/json' -d '{\"status\": \"approved\"}'"
                    }
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
            echo "Deployment successful! http://your-ec2-ip"
        }
        failure {
            echo "Deployment failed. Check terminal output."
        }
    }
}

// Helper function defined OUTSIDE the pipeline block
def notifyStage(String name, String status) {
    if (env.DEPLOYMENT_ID) {
        echo "Notifying Tracker Stage: ${name} -> ${status}"
        def stagePayload = """
        {
            "stageName": "${name}",
            "status": "${status}"
        }
        """
        writeFile file: "stage_update.json", text: stagePayload
        sh "curl -s -X PATCH ${env.VITE_API_URL}/deployments/${env.DEPLOYMENT_ID}/stage -H 'Content-Type: application/json' -d @stage_update.json"
    } else {
        echo "Skipping Tracker Notification for stage ${name} as DEPLOYMENT_ID is missing."
    }
}