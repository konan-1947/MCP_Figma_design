/**
 * Electron Main Process
 * Manages:
 * - HTTP Server startup (Gemini backend)
 * - Browser window creation
 * - App lifecycle
 */

import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import isDev from 'electron-is-dev';

let mainWindow: BrowserWindow | null = null;
let geminiServer: ChildProcess | null = null;
let isServerReady = false;

/**
 * Start the Gemini HTTP Server
 */
const startGeminiServer = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log('[Electron] Starting Gemini HTTP Server...');

    const serverPath = path.join(__dirname, isDev 
      ? '../dist/start-gemini-http.js'
      : '../start-gemini-http.js'
    );

    geminiServer = spawn('node', [serverPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { 
        ...process.env, 
        NODE_ENV: isDev ? 'development' : 'production'
      }
    });

    // Capture output for debugging
    geminiServer.stdout?.on('data', (data) => {
      const message = data.toString();
      console.log('[Gemini Server]', message);
      
      // Mark as ready when we see the success message
      if (message.includes('Gemini HTTP Server is Running')) {
        isServerReady = true;
        if (!isDev) {
          console.log('[Electron] Server ready, creating window...');
        }
      }
    });

    geminiServer.stderr?.on('data', (data) => {
      console.error('[Gemini Server Error]', data.toString());
    });

    geminiServer.on('error', (error) => {
      console.error('[Electron] Failed to start server:', error);
      reject(error);
    });

    // Wait for server startup (check for logs)
    const timeout = setTimeout(() => {
      isServerReady = true;
      resolve();
    }, 3000); // Wait max 3 seconds

    // Resolve when server signals readiness
    if (geminiServer.stdout) {
      geminiServer.stdout.once('data', () => {
        clearTimeout(timeout);
        setTimeout(resolve, 1000);
      });
    }
  });
};

/**
 * Create the Electron window
 */
const createWindow = (): void => {
  console.log('[Electron] Creating window...');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true
    },
    icon: path.join(__dirname, isDev ? '../public/icon.png' : '../icon.png')
  });

  // Determine app URL
  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist-web/index.html')}`;

  console.log('[Electron] Loading:', startUrl);
  mainWindow.loadURL(startUrl);

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

/**
 * App event handlers
 */
app.on('ready', async () => {
  console.log('[Electron] App ready');
  
  try {
    // Start server first
    await startGeminiServer();
    console.log('[Electron] Server started');

    // Then create window
    createWindow();

    // Setup menu
    createMenu();
  } catch (error) {
    console.error('[Electron] Startup failed:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  console.log('[Electron] All windows closed');
  
  // Kill server on Windows (doesn't auto-close like on Mac)
  if (geminiServer && !geminiServer.killed) {
    console.log('[Electron] Killing Gemini server...');
    geminiServer.kill();
  }

  // Quit app (except on macOS)
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('[Electron] App activated');
  
  if (mainWindow === null) {
    createWindow();
  }
});

/**
 * Handle app quit
 */
app.on('before-quit', () => {
  console.log('[Electron] Before quit - killing server');
  if (geminiServer && !geminiServer.killed) {
    geminiServer.kill('SIGTERM');
  }
});

/**
 * Create application menu
 */
const createMenu = (): void => {
  const template: any[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            const aboutWindow = new BrowserWindow({
              width: 400,
              height: 300,
              modal: true,
              show: false
            });

            aboutWindow.loadURL(`data:text/html,
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <title>About</title>
              </head>
              <body style="font-family: system-ui; padding: 20px;">
                <h1>Figma Design Assistant</h1>
                <p>Version: 1.0.0</p>
                <p>Design with Gemini AI</p>
                <hr>
                <p><strong>Backend:</strong> Gemini API</p>
                <p><strong>Server:</strong> localhost:8765</p>
              </body>
              </html>
            `);

            aboutWindow.show();
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

/**
 * IPC handlers for React <-> Main communication
 */
ipcMain.handle('get-server-status', () => {
  return {
    ready: isServerReady,
    url: 'http://localhost:8765'
  };
});

ipcMain.handle('open-external', (event, url: string) => {
  const { shell } = require('electron');
  return shell.openExternal(url);
});

/**
 * Handle any uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  console.error('[Electron] Uncaught exception:', error);
});

console.log('[Electron] Main process loaded');
