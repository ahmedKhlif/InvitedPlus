const { exec } = require('child_process');
const net = require('net');

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true); // Port is available
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false); // Port is busy
    });
  });
}

async function findAvailablePort(startPort = 3001) {
  for (let port = startPort; port <= startPort + 10; port++) {
    const isAvailable = await checkPort(port);
    if (isAvailable) {
      return port;
    }
  }
  throw new Error('No available ports found');
}

async function startServer() {
  try {
    console.log('🔍 Checking for available ports...');
    
    const port = await findAvailablePort(3001);
    
    if (port !== 3001) {
      console.log(`⚠️  Port 3001 is busy, using port ${port} instead`);
      console.log(`📝 Update your frontend to use: http://localhost:${port}`);
    } else {
      console.log('✅ Port 3001 is available');
    }
    
    // Set the port environment variable
    process.env.PORT = port.toString();
    
    console.log(`🚀 Starting server on port ${port}...`);
    
    // Start the NestJS application
    const child = exec('npm run start:dev', {
      env: { ...process.env, PORT: port.toString() }
    });
    
    child.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    child.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    child.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
    });
    
  } catch (error) {
    console.error('❌ Error starting server:', error.message);
    process.exit(1);
  }
}

startServer();
