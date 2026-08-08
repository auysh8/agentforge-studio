const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const net = require('net');
const { fork } = require('child_process');
const fs = require('fs');

let mainWindow = null;
let serverProcess = null;

const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';

function getAvailablePort() {
  if (process.env.PORT) {
    return Promise.resolve(parseInt(process.env.PORT, 10));
  }
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

function waitForServer(url, timeout = 30000) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(url, (res) => {
        resolve();
      }).on('error', () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout waiting for server at ${url}`));
        } else {
          setTimeout(check, 250);
        }
      });
    };
    check();
  });
}

function copyDirRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursiveSync(srcPath, destPath);
    } else if (!fs.existsSync(destPath)) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function killServerProcess() {
  if (serverProcess) {
    try {
      serverProcess.kill('SIGTERM');
      setTimeout(() => {
        if (serverProcess && !serverProcess.killed) {
          try {
            serverProcess.kill('SIGKILL');
          } catch (_) {}
        }
      }, 2000);
    } catch (e) {
      console.error('Failed to kill server process:', e);
    }
    serverProcess = null;
  }
}

function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'AgentForge Studio',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadURL(url);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function startApp() {
  let url = 'http://localhost:3000';

  if (!isDev) {
    const port = await getAvailablePort();
    url = `http://localhost:${port}`;

    const rawAppPath = app.getAppPath();
    const appDir = rawAppPath.endsWith('app.asar')
      ? path.join(path.dirname(rawAppPath), 'app.asar.unpacked')
      : rawAppPath;

    const standaloneDir = path.join(appDir, '.next', 'standalone');
    const standaloneServerPath = path.join(standaloneDir, 'server.js');

    if (fs.existsSync(standaloneServerPath)) {
      serverProcess = fork(standaloneServerPath, [], {
        cwd: standaloneDir,
        env: {
          ...process.env,
          PORT: port.toString(),
          HOSTNAME: '127.0.0.1',
          NODE_ENV: 'production',
        },
        stdio: 'inherit',
      });
    } else {
      console.error(`Standalone server file not found at: ${standaloneServerPath}`);
    }

    await waitForServer(url);
  }

  createWindow(url);
}

app.whenReady().then(startApp);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    if (isDev) {
      createWindow('http://localhost:3000');
    } else {
      startApp();
    }
  }
});

app.on('before-quit', killServerProcess);
app.on('will-quit', killServerProcess);
process.on('exit', killServerProcess);
process.on('SIGINT', () => {
  killServerProcess();
  process.exit(0);
});
process.on('SIGTERM', () => {
  killServerProcess();
  process.exit(0);
});
