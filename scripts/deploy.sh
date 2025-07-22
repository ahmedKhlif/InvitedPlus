#!/bin/bash

# ==============================================
# INVITED+ PRODUCTION DEPLOYMENT SCRIPT
# ==============================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="invited-plus"
DOCKER_COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env.production"
BACKUP_DIR="./backups"
LOG_FILE="./logs/deployment.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    mkdir -p logs backups nginx/ssl monitoring/prometheus monitoring/grafana
    success "Directories created"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        warning "Environment file $ENV_FILE not found. Creating from template..."
        cp .env.production.example "$ENV_FILE" 2>/dev/null || {
            error "Could not create environment file. Please create $ENV_FILE manually."
        }
    fi
    
    success "Prerequisites check passed"
}

# Backup existing data
backup_data() {
    log "Creating backup of existing data..."
    
    if [ -d "backend/data" ]; then
        BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR/$BACKUP_NAME"
        
        # Backup database
        if docker ps | grep -q "${PROJECT_NAME}_postgres"; then
            log "Backing up PostgreSQL database..."
            docker exec "${PROJECT_NAME}_postgres" pg_dump -U postgres invited_plus > "$BACKUP_DIR/$BACKUP_NAME/database.sql"
        fi
        
        # Backup uploads
        if [ -d "backend/uploads" ]; then
            log "Backing up uploaded files..."
            cp -r backend/uploads "$BACKUP_DIR/$BACKUP_NAME/"
        fi
        
        success "Backup created: $BACKUP_DIR/$BACKUP_NAME"
    else
        log "No existing data to backup"
    fi
}

# Build and deploy
deploy() {
    log "Starting deployment..."
    
    # Pull latest images
    log "Pulling latest Docker images..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" pull
    
    # Build custom images
    log "Building application images..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache
    
    # Stop existing containers
    log "Stopping existing containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    
    # Start new containers
    log "Starting new containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    success "Deployment completed"
}

# Health check
health_check() {
    log "Performing health checks..."
    
    # Wait for services to start
    sleep 30
    
    # Check backend health
    if curl -f http://localhost:3001/health &> /dev/null; then
        success "Backend is healthy"
    else
        error "Backend health check failed"
    fi
    
    # Check frontend health
    if curl -f http://localhost:3000 &> /dev/null; then
        success "Frontend is healthy"
    else
        error "Frontend health check failed"
    fi
    
    # Check database connection
    if docker exec "${PROJECT_NAME}_postgres" pg_isready -U postgres &> /dev/null; then
        success "Database is healthy"
    else
        error "Database health check failed"
    fi
    
    success "All health checks passed"
}

# Setup SSL certificates (Let's Encrypt)
setup_ssl() {
    log "Setting up SSL certificates..."
    
    if [ ! -f "nginx/ssl/cert.pem" ]; then
        warning "SSL certificates not found. Setting up Let's Encrypt..."
        
        # Install certbot if not present
        if ! command -v certbot &> /dev/null; then
            log "Installing certbot..."
            sudo apt-get update
            sudo apt-get install -y certbot python3-certbot-nginx
        fi
        
        # Generate certificates
        read -p "Enter your domain name: " DOMAIN_NAME
        sudo certbot certonly --standalone -d "$DOMAIN_NAME"
        
        # Copy certificates
        sudo cp "/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem" nginx/ssl/cert.pem
        sudo cp "/etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem" nginx/ssl/key.pem
        sudo chown $(whoami):$(whoami) nginx/ssl/*
        
        success "SSL certificates configured"
    else
        log "SSL certificates already exist"
    fi
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Create Prometheus configuration
    cat > monitoring/prometheus/prometheus.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'invited-plus-backend'
    static_configs:
      - targets: ['backend:3001']
  
  - job_name: 'invited-plus-frontend'
    static_configs:
      - targets: ['frontend:3000']
  
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
  
  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
EOF
    
    # Start monitoring services
    docker-compose -f "$DOCKER_COMPOSE_FILE" --profile monitoring up -d
    
    success "Monitoring setup completed"
}

# Setup automated backups
setup_backups() {
    log "Setting up automated backups..."
    
    # Create backup script
    cat > scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="./backups"
BACKUP_NAME="auto_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

# Backup database
docker exec invited-plus_postgres pg_dump -U postgres invited_plus > "$BACKUP_DIR/$BACKUP_NAME/database.sql"

# Backup uploads
cp -r backend/uploads "$BACKUP_DIR/$BACKUP_NAME/" 2>/dev/null || true

# Cleanup old backups (keep last 7 days)
find "$BACKUP_DIR" -type d -name "auto_backup_*" -mtime +7 -exec rm -rf {} \;

echo "Backup completed: $BACKUP_NAME"
EOF
    
    chmod +x scripts/backup.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "0 2 * * * $(pwd)/scripts/backup.sh") | crontab -
    
    success "Automated backups configured"
}

# Main deployment function
main() {
    log "🚀 Starting Invited+ deployment..."
    
    create_directories
    check_prerequisites
    backup_data
    
    # Ask for deployment type
    echo ""
    echo "Select deployment type:"
    echo "1) Development"
    echo "2) Production"
    echo "3) Production with SSL"
    echo "4) Production with SSL and Monitoring"
    read -p "Enter your choice (1-4): " DEPLOY_TYPE
    
    case $DEPLOY_TYPE in
        1)
            log "Deploying in development mode..."
            deploy
            ;;
        2)
            log "Deploying in production mode..."
            deploy
            ;;
        3)
            log "Deploying in production mode with SSL..."
            setup_ssl
            deploy
            ;;
        4)
            log "Deploying in production mode with SSL and monitoring..."
            setup_ssl
            setup_monitoring
            deploy
            setup_backups
            ;;
        *)
            error "Invalid choice. Please select 1-4."
            ;;
    esac
    
    health_check
    
    success "🎉 Deployment completed successfully!"
    
    echo ""
    echo "📋 Deployment Summary:"
    echo "====================="
    echo "Frontend: http://localhost:3000"
    echo "Backend API: http://localhost:3001"
    echo "API Documentation: http://localhost:3001/api"
    
    if [ "$DEPLOY_TYPE" -ge 4 ]; then
        echo "Prometheus: http://localhost:9090"
        echo "Grafana: http://localhost:3001 (admin/admin)"
    fi
    
    echo ""
    echo "📝 Next Steps:"
    echo "=============="
    echo "1. Update your DNS records to point to this server"
    echo "2. Configure your OAuth applications with the new domain"
    echo "3. Update environment variables with production values"
    echo "4. Set up monitoring alerts"
    echo "5. Test all functionality"
    
    log "Deployment script completed"
}

# Run main function
main "$@"
