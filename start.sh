#!/bin/bash

echo "Starting Inventory Management System..."
echo

echo "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install root dependencies"
    exit 1
fi

cd server
echo "Installing server dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install server dependencies"
    exit 1
fi

cd ../client
echo "Installing client dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install client dependencies"
    exit 1
fi

cd ..
echo
echo "All dependencies installed successfully!"
echo
echo "Starting the application..."
echo "Backend will run on: http://localhost:5000"
echo "Frontend will run on: http://localhost:3000"
echo
echo "Default login credentials:"
echo "Admin: admin / admin123"
echo "Manager: manager / manager123"
echo "Cashier: cashier / cashier123"
echo
echo "Press Ctrl+C to stop the application"
echo

npm run dev
