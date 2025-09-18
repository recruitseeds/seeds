#!/bin/bash

echo "🔧 Setting up Recruit Seeds systemd services..."

# Copy service files
sudo cp deployment/systemd/*.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable services to start on boot
sudo systemctl enable recruit-seeds-api
sudo systemctl enable recruit-seeds-web  
sudo systemctl enable recruit-seeds-jobs

# Set correct ownership
sudo chown -R www-data:www-data /var/www/recruit-seeds

echo "✅ Services configured!"
echo ""
echo "To start services:"
echo "sudo systemctl start recruit-seeds-api"
echo "sudo systemctl start recruit-seeds-web"
echo "sudo systemctl start recruit-seeds-jobs"
echo ""
echo "To check status:"
echo "sudo systemctl status recruit-seeds-api"
echo "sudo systemctl status recruit-seeds-web" 
echo "sudo systemctl status recruit-seeds-jobs"
echo ""
echo "To view logs:"
echo "sudo journalctl -u recruit-seeds-api -f"
echo "sudo journalctl -u recruit-seeds-web -f"
echo "sudo journalctl -u recruit-seeds-jobs -f"