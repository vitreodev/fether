// Copyright 2015-2018 Parity Technologies (UK) Ltd.
// This file is part of Parity.
//
// SPDX-License-Identifier: MIT

const electron = require('electron');
const path = require('path');
const url = require('url');

const addMenu = require('./menu');
const cli = require('./cli');
const doesParityExist = require('./operations/doesParityExist');
const fetchParity = require('./operations/fetchParity');
const handleError = require('./operations/handleError');
const messages = require('./messages');
const { runParity, killParity } = require('./operations/runParity');

const { app, BrowserWindow, ipcMain, session } = electron;
let mainWindow;

// Get arguments from cli
const [argv] = cli();

function createWindow() {
  // If cli() returns false, then it means that the arguments are stopping the
  // app (e.g. --help or --version). We don't do anything more in this case.
  if (!argv) {
    return;
  }

  mainWindow = new BrowserWindow({
    height: 800,
    width: 1200
  });

  doesParityExist()
    .catch(() => fetchParity(mainWindow)) // Install parity if not present
    .then(() => runParity(mainWindow))
    .catch(handleError); // Errors should be handled before, this is really just in case

  if (argv['ui-dev'] === true) {
    // Opens http://127.0.0.1:3000 in --ui-dev mode
    mainWindow.loadURL('http://127.0.0.1:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // Opens file:///path/to/.build/index.html in prod mode
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, '..', '.build', 'index.html'),
        protocol: 'file:',
        slashes: true
      })
    );
  }

  // Listen to messages from renderer process
  ipcMain.on('asynchronous-message', messages);

  // Add application menu
  addMenu(mainWindow);

  // WS calls have Origin `file://` by default, which is not trusted.
  // We override Origin header on all WS connections with an authorized one.
  session.defaultSession.webRequest.onBeforeSendHeaders(
    {
      urls: ['ws://*/*', 'wss://*/*']
    },
    (details, callback) => {
      details.requestHeaders.Origin = `parity://${mainWindow.id}.ui.parity`;
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    killParity();
    app.quit();
  }
});

// Make sure parity stops when UI stops
app.on('before-quit', killParity);
app.on('will-quit', killParity);
app.on('quit', killParity);

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
