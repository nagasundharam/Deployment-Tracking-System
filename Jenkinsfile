pipeline {
    agent any

    parameters {
        string(name: 'PROJECT_ID', defaultValue: '', description: 'The MongoDB Project ID for tracking')
        string(name: 'ENVIRONMENT_ID', defaultValue: '', description: 'The MongoDB Environment ID for tracking')
        string(name: 'DEPLOY_BRANCH', defaultValue: 'main', description: 'Branch to deploy')
    }

    environment {
        // AWS Environment Variables (configured in Jenkins Credentials)
        AWS_REGION = 'us-east-1'
        S3_BUCKET = 'your-frontend-bucket-name'
        
        // EC2 Backend Variables
        EC2_USER = 'ubuntu'
        EC2_HOST = 'your-ec2-public-ip-or-dns'
        BACKEND_DIR = '/home/ubuntu/Deployment-Tracking-System/Backend'
    }

    stages {
        stage('Checkout Source Code') {
            steps {
                checkout scm
                script {
                    // Extract Git details for tracking
                    env.COMMIT_MSG = sh(script: "git log -1 --pretty=%B", returnStdout: true).trim()
                    env.COMMIT_AUTHOR = sh(script: "git log -1 --pretty=%an", returnStdout: true).trim()
                    env.COMMIT_AUTHOR_EMAIL = sh(script: "git log -1 --pretty=%ae", returnStdout: true).trim()
                    env.COMMIT_HASH = sh(script: "git rev-parse HEAD", returnStdout: true).trim()
                    
                    echo "Commit Info: ${env.COMMIT_MSG} by ${env.COMMIT_AUTHOR}"
                }
            }
        }

        /* 
        ========================================
        FRONTEND BUILD & S3 DEPLOYMENT (React)
        ========================================
        */
        stage('Build Frontend (Vite)') {
            steps {
                dir('Frontend/deployment-tracker') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Deploy Frontend to AWS S3') {
            steps {
                dir('Frontend/deployment-tracker/dist') {
                    // Requires AWS CLI installed on Jenkins runner and IAM Role access
                    sh "aws s3 sync . s3://${S3_BUCKET} --delete --region ${AWS_REGION}"
                    
                    // Optional: If you use CloudFront, invalidate the cache
                    // sh "aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths '/*'"
                }
            }
        }

        /* 
        ========================================
        BACKEND DEPLOYMENT TO EC2 (Node.js)
        ========================================
        */
        stage('Deploy Backend (EC2)') {
            steps {
                // Using SSH Agent plugin in Jenkins to securely use SSH keys
                sshagent(['YOUR_JENKINS_EC2_CREDENTIAL_ID']) {
                    sh """
                        // SSH into EC2, navigate to backend directory, pull latest main, and restart app via PM2
                        ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} '
                            cd ${BACKEND_DIR} &&
                            git pull origin main &&
                            npm install --production &&
                            pm2 restart deployment-tracker-backend || pm2 start index.js --name "deployment-tracker-backend" &&
                            pm2 save
                        '
                    """
                }
            }
        }

        /* 
        ========================================
        RECORD DEPLOYMENT IN YOUR SYSTEM
        ========================================
        */
        stage('Update DeployFlow Tracker') {
            steps {
                script {
                    // Hit the custom webhook in your own backend to record this deployment
                    def response = sh(script: """
                        curl -s -X POST http://${EC2_HOST}:5000/api/jenkins-webhook \\
                        -H "Content-Type: application/json" \\
                        -d '{
                            "project_id": "${params.PROJECT_ID}",
                            "environment_id": "${params.ENVIRONMENT_ID}",
                            "pipeline_id": "${env.BUILD_NUMBER}",
                            "version": "${env.COMMIT_HASH}",
                            "branch": "${params.DEPLOY_BRANCH}",
                            "commit_message": "${env.COMMIT_MSG}",
                            "commit_author": "${env.COMMIT_AUTHOR}",
                            "commit_author_email": "${env.COMMIT_AUTHOR_EMAIL}",
                            "commit_hash": "${env.COMMIT_HASH}",
                            "triggered_by": {
                                "username": "Jenkins AWS Deployer",
                                "user_id": "system"
                            }
                        }'
                    """, returnStdout: true).trim()
                    echo "Tracker Response: ${response}"
                }
            }
        }
    }

    post {
        success {
            echo "Successfully deployed Frontend to S3 and Backend to EC2!"
        }
        failure {
            echo "AWS Deployment failed. Check Jenkins console logs."
        }
    }
}
