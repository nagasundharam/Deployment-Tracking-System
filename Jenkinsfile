import groovy.json.JsonOutput

pipeline {
    agent any

    parameters {
        string(name: 'PROJECT_ID', defaultValue: '69d0996c860c3a42c3d8de5b', description: 'The unique ID of the project in the tracker')
        string(name: 'ENVIRONMENT_ID', defaultValue: '69d099d1860c3a42c3d8de6d', description: 'The target environment ID')
        string(name: 'DEPLOY_BRANCH', defaultValue: 'main', description: 'The branch being deployed')
        string(name: 'EC2_HOST', defaultValue: '34.204.195.105', description: 'The IP/Host of your Deployment Tracker backend')
    }

    environment {
        // Mapping Jenkins Credentials to Environment Variables
        MONGO_URI     = credentials('MONGO_URI')
        JWT_SECRET    = credentials('JWT_SECRET')
        DATABASE_PORT = credentials('DATABASE_PORT')
        VITE_API_URL  = credentials('VITE_API_URL')
        
        COMMIT_HASH = ""
        PUBLIC_IP   = ""
        DEPLOYMENT_ID = ""
    }

    stages {
        stage('Initialize Tracker') {
            steps {
                script {
                    echo "Extracting Git Metadata..."
                    checkout scm
                    def localCommitHash = sh(script: "git rev-parse HEAD", returnStdout: true).trim()
                    def localCommitMsg = sh(script: "git log -1 --pretty=%B", returnStdout: true).trim()
                    def localCommitAuthor = sh(script: "git log -1 --pretty=%an", returnStdout: true).trim()
                    def localCommitEmail = sh(script: "git log -1 --pretty=%ae", returnStdout: true).trim()
                    env.PUBLIC_IP = sh(script: "curl -s http://checkip.amazonaws.com", returnStdout: true).trim()

                    def payload = [
                        project_id: params.PROJECT_ID,
                        environment_id: params.ENVIRONMENT_ID,
                        pipeline_id: env.BUILD_NUMBER,
                        version: "1.0.${env.BUILD_NUMBER}",
                        branch: params.DEPLOY_BRANCH,
                        commit_message: localCommitMsg,
                        commit_author: localCommitAuthor,
                        commit_author_email: localCommitEmail,
                        commit_hash: localCommitHash,
                        public_url: "http://${env.PUBLIC_IP}",
                        node_name: env.NODE_NAME ?: "master",
                        triggered_by: [username: localCommitAuthor, source: "jenkins"],
                        stages: [
                            [name: "Initialize Tracker", status: "pending"],
                            [name: "Install & Build", status: "pending"],
                            [name: "Deploy Services", status: "pending"]
                        ]
                    ]

                    writeFile file: 'initial_payload.json', text: JsonOutput.toJson(payload)
                    
                    echo "Attempting to initialize Deployment Record..."
                    
                    // FAIL-SAFE: Try-Catch block to prevent Exit Code 7 from stopping the build
                    try {
                        def response = sh(script: "curl -s --max-time 10 -X POST ${env.VITE_API_URL}/jenkins-webhook -H 'Content-Type: application/json' -d @initial_payload.json", returnStdout: true).trim()
                        echo "Raw Response: ${response}"
                        
                        // Use the Pipeline Utility Steps plugin to read the JSON comfortably
                        writeFile file: 'response.json', text: response
                        def json = readJSON file: 'response.json'
                        
                        // Debugging: Print keys to see structure
                        echo "JSON Keys: ${json.keySet()}"
                        if (json.deployment) {
                            echo "Deployment Found in JSON"
                            env.DEPLOYMENT_ID = json.deployment._id
                        }
                        
                        if (env.DEPLOYMENT_ID && env.DEPLOYMENT_ID != "null") {
                            echo "Tracker Initialized successfully. ID: ${env.DEPLOYMENT_ID}"
                            // Update this stage to success now that we have an initialized deployment
                            notifyStage("Initialize Tracker", "success")
                        } else {
                            echo "ERROR: DEPLOYMENT_ID is empty or null after parsing. JSON: ${response}"
                        }
                    } catch (Exception e) {
                        echo "--------------------------------------------------------------------------------"
                        echo "WARNING: Could not connect to Tracker Backend or parse ID. Error: ${e.message}"
                        echo "Proceeding to Deploy stage to ensure containers are updated and healthy."
                        echo "--------------------------------------------------------------------------------"
                    }
                }
            }
        }

        stage('Install & Build') {
            steps {
                script {
                    notifyStage("Install & Build", "running")
                    echo "Starting frontend build process..."
                    
                    // INTENTIONAL FAILURE FOR UI VERIFICATION
                    // sh 'echo "Simulating failure in Install & Build stage..." && exit 1'
                    
                    notifyStage("Install & Build", "success")
                }
            }
        }

        stage('Deploy Services') {
            steps {
                script {
                    // This helper will only run if DEPLOYMENT_ID was captured
                    notifyStage("Deploy Services", "running")
                    
                    echo "Starting Docker Deployment..."
                    sh """
                        export MONGO_URI='${env.MONGO_URI}'
                        export JWT_SECRET='${env.JWT_SECRET}'
                        export PORT='${env.DATABASE_PORT}'
                        export VITE_API_URL='${env.VITE_API_URL}'
                        
                        docker compose up -d --build --force-recreate
                    """
                    
                    notifyStage("Deploy Services", "success")
                }
            }
        }
    }

    post {
        success {
            script {
                if (env.DEPLOYMENT_ID) {
                    echo "Marking Deployment as Success..."
                    sh "curl -v -X PATCH ${env.VITE_API_URL}/deployments/${env.DEPLOYMENT_ID}/status -H 'Content-Type: application/json' -d '{\"status\": \"success\"}'"
                }
            }
            echo "DEPLOYMENT SUCCESSFUL"
        }
        failure {
            script {
                if (env.DEPLOYMENT_ID) {
                    echo "Marking Deployment as Failed..."
                    notifyStage("Install & Build", "failure")
                    sh "curl -v -X PATCH ${env.VITE_API_URL}/deployments/${env.DEPLOYMENT_ID}/status -H 'Content-Type: application/json' -d '{\"status\": \"failed\"}'"
                }
            }
            echo "DEPLOYMENT FAILED"
        }
    }
}

def notifyStage(String name, String status) {
    if (env.DEPLOYMENT_ID) {
        try {
            echo "Notifying Stage: ${name} -> ${status}"
            def stagePayload = [stageName: name, status: status]
            writeFile file: "stage_data.json", text: JsonOutput.toJson(stagePayload)
            def response = sh(script: "curl -v -X PATCH ${env.VITE_API_URL}/deployments/${env.DEPLOYMENT_ID}/stage -H 'Content-Type: application/json' -d @stage_data.json", returnStdout: true).trim()
            echo "Stage Notification Response: ${response}"
        } catch (Exception e) {
            echo "Notification failed for ${name}: ${e.message}"
        }
    }
}