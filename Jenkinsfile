import groovy.json.JsonOutput

pipeline {
    agent any

    parameters {
        string(name: 'PROJECT_ID', defaultValue: '69d0996c860c3a42c3d8de5b', description: 'Project ID')
        string(name: 'ENVIRONMENT_ID', defaultValue: '69d099d1860c3a42c3d8de6d', description: 'Environment ID')
        string(name: 'DEPLOY_BRANCH', defaultValue: 'main', description: 'Branch')
        string(name: 'EC2_HOST', defaultValue: '34.204.195.105', description: 'Backend Host')
    }
    environment {
        // These must match the IDs in your screenshot exactly
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
                        triggered_by: [username: localCommitAuthor, source: "jenkins"]
                    ]

                    writeFile file: 'initial_payload.json', text: JsonOutput.toJson(payload)
                    
                    // This will now work because the backend will be UP after the first successful run
                    def response = sh(script: "curl -s -X POST ${env.VITE_API_URL}/jenkins-webhook -H 'Content-Type: application/json' -d @initial_payload.json", returnStdout: true)
                    env.DEPLOYMENT_ID = sh(script: "echo '${response}' | grep -oP '\"_id\":\"\\K[^\"]+' | head -1", returnStdout: true).trim()
                }
            }
        }

        stage('Deploy Services (Docker)') {
            steps {
                script {
                    notifyStage("Deploy Services", "running")
                    
                    // FIX 2: This is the command that actually fixes your site.
                    // It passes the MONGO_URI from Jenkins into the Docker Compose environment.
                    sh """
                        export MONGO_URI='${env.MONGO_URI}'
                        export JWT_SECRET='${env.JWT_SECRET}'
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
                    sh "curl -s -X PATCH ${env.VITE_API_URL}/deployments/${env.DEPLOYMENT_ID}/status -H 'Content-Type: application/json' -d '{\"status\": \"success\"}'"
                }
            }
        }
        failure {
            script {
                if (env.DEPLOYMENT_ID) {
                    sh "curl -s -X PATCH ${env.VITE_API_URL}/deployments/${env.DEPLOYMENT_ID}/status -H 'Content-Type: application/json' -d '{\"status\": \"failed\"}'"
                }
            }
        }
    }
}

def notifyStage(String name, String status) {
    if (env.DEPLOYMENT_ID) {
        def stagePayload = [stageName: name, status: status]
        writeFile file: "stage_data.json", text: JsonOutput.toJson(stagePayload)
        sh "curl -s -X PATCH ${env.VITE_API_URL}/deployments/${env.DEPLOYMENT_ID}/stage -H 'Content-Type: application/json' -d @stage_data.json"
    }
}