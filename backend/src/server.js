/*
 * Server Entry Point
 * Starts the Express server and connects to Fabric.
 */

'use strict';

require('dotenv').config();

const app = require('./app');
const fabricService = require('./services/fabricService');

const PORT = process.env.PORT || 3001;

async function main() {
    try {
        // Connect to Fabric network on startup
        await fabricService.connectToFabric();
        console.log('Fabric connection established.');

        // Start Express server
        app.listen(PORT, () => {
            console.log(`\n========================================`);
            console.log(`  Supply Chain Backend is running`);
            console.log(`  Port: ${PORT}`);
            console.log(`  API: http://localhost:${PORT}/api`);
            console.log(`  Health: http://localhost:${PORT}/api/health`);
            console.log(`========================================\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down...');
    fabricService.disconnect();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nShutting down...');
    fabricService.disconnect();
    process.exit(0);
});

main();
