# Hyder OS Desktop App Packaging Guide (Windows & Mac)

Since this app is built as a highly responsive, modern full-stack styled React + Vite web-app, you can very easily build it into a **native standalone desktop application (.exe for Windows / .app for macOS)** to run locally offline!

Below is the recommended step-by-step method using **Electron** or **Tauri** to turn your web files into a desktop binary (.exe).

---

## Method 1: Packaging with Electron (Easiest)

Follow these steps on your own computer after exporting the project:

### Step 1: Export your project code
Export your workspace or zip the project folder and download it to your local machine.

### Step 2: Install Local Dependencies
Open your command prompt or terminal in the project directory and install Electron dependencies:
```bash
npm install electron electron-builder --save-dev
```

### Step 3: Create Electron Entry script (`main.js`)
Create a file named `main.js` in the root folder with the following content:

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'dist', 'favicon.ico') // Add your icon
  });

  // Load the built index.html from Vite's build output
  win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  
  // Maximize the window for full immersive experience
  win.maximize();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

### Step 4: Configure `package.json`
Update your local `package.json` with the following configuration:

1. Add `"main": "main.js"` at the top level.
2. Add packaging scripts inside `"scripts"`:
```json
"scripts": {
  "build": "vite build",
  "build-desktop": "npm run build && electron-builder"
}
```
3. Add the build configuration block to package correctly:
```json
"build": {
  "appId": "com.hyder.os",
  "productName": "Hyder OS",
  "files": [
    "dist/**/*",
    "main.js"
  ],
  "directories": {
    "output": "dist-desktop"
  },
  "win": {
    "target": "nsis"
  }
}
```

### Step 5: Build the Windows Executable (.exe)
Run the single build command on your machine:
```bash
npm run build-desktop
```
This will compile all your React resources and output a beautifully packed, standalone installation executable **(.exe)** inside the `dist-desktop/` folder!

---

## Method 2: High Performance Packaging with Tauri (Recommended for Lightweight Apps)

Tauri creates extremely small executables (< 10MB) because it uses the system webview instead of packaging Chromium.

### Step 1: Install Tauri CLI
```bash
npm install @tauri-apps/cli --save-dev
```

### Step 2: Initialize Tauri Config
```bash
npx tauri init
```
Provide the following answers when prompted:
- **What is your app name?**: Hyder OS
- **What is the window title?**: Hyder Operating System
- **Where are your web assets?**: `../dist`
- **What is your dev server URL?**: `http://localhost:3000`

### Step 3: Build your App
Run:
```bash
npm run build
npx tauri build
```
The optimized `.exe` file will be generated in `src-tauri/target/release/bundle/nsis/`.
