import groovy.json.JsonOutput

pipeline {
    agent any
    parameters {
        string(name: 'PROJECT_ID', defaultValue: '69ce6897557b3606c5b165ec')
        string(name: 'ENVIRONMENT_ID', defaultValue: '69ce68b3557b3606c5b165fb')
        string(name: 'EC2_HOST', defaultValue: '34.204.195.105')
    }

    environment {
        VITE_API_URL = "http://${params.EC2_HOST}:5000/api"
        // Initialize as empty string
        DEPLOYMENT_ID = "" 
    }

    stages {
        stage('Initialize Tracker') {
            steps {
                script {
                    checkout scm
                    def publicIp = sh(script: "curl -s http://checkip.amazonaws.com", returnStdout: true).trim()
                    
                    def payload = [
                        project_id: params.PROJECT_ID,
                        environment_id: params.ENVIRONMENT_ID,
                        pipeline_id: env.BUILD_NUMBER,
                        version: "1.0.${env.BUILD_NUMBER}",
                        branch: "main",
                        commit_message: sh(script: "git log -1 --pretty=%B", returnStdout: true).trim(),
                        commit_author: sh(script: "git log -1 --pretty=%an", returnStdout: true).trim(),
                        public_url: "http://${publicIp}",
                        stages: [
                            [name: "Initialize Tracker", status: "pending"],
                            [name: "Install & Build", status: "pending"],
                            [name: "Deploy Frontend", status: "pending"]
                        ]
                    ]

                    writeFile file: 'initial_payload.json', text: JsonOutput.toJson(payload)
                    
                    // CRITICAL: We use returnStdout and assign specifically to env.DEPLOYMENT_ID
                    def response = sh(script: "curl -s -X POST ${env.VITE_API_URL}/jenkins-webhook -H 'Content-Type: application/json' -d @initial_payload.json", returnStdout: true).trim()
                    
                    // This regex matches your specific JSON response format
                    env.DEPLOYMENT_ID = sh(script: "echo '${response}' | grep -oP '\"_id\":\"\\K[^\"]+' | head -1", returnStdout: true).trim()
                    
                    echo "Captured ID: ${env.DEPLOYMENT_ID}"
                    notifyStage("Initialize Tracker", "success")
                }
            }
        }

        stage('Install & Build') {
            steps {
                script {
                    notifyStage("Install & Build", "running")
                    sh 'npm install'
                    sh 'exit 1' // This triggers the failure
                    notifyStage("Install & Build", "success")
                }
            }
        }
    }

    post {
        failure {
            script {
                // If the ID was captured, we send the failure notification
                if (env.DEPLOYMENT_ID && env.DEPLOYMENT_ID != "") {
                    echo "Sending Failure Notification for ID: ${env.DEPLOYMENT_ID}"
                    
                    // 1. Mark the specific stage as failed
                    notifyStage("Install & Build", "failed")
                    
                    // 2. Mark the whole deployment as failed
                    sh "curl -s -X PATCH ${env.VITE_API_URL}/deployments/${env.DEPLOYMENT_ID}/status -H 'Content-Type: application/json' -d '{\"status\": \"failed\"}'"
                } else {
                    echo "CANNOT NOTIFY BACKEND: DEPLOYMENT_ID is empty. Check Initialize Tracker stage."
                }
            }
        }
    }
}

def notifyStage(String name, String status) {
    // Accessing env.DEPLOYMENT_ID directly
    if (env.DEPLOYMENT_ID && env.DEPLOYMENT_ID != "") {
        def stagePayload = [stageName: name, status: status]
        writeFile file: "stage_data.json", text: JsonOutput.toJson(stagePayload)
        sh "curl -s -X PATCH ${env.VITE_API_URL}/deployments/${env.DEPLOYMENT_ID}/stage -H 'Content-Type: application/json' -d @stage_data.json"
    }
}