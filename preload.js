const { contextBridge, ipcRenderer, shell } = require('electron'); // Correct import
const fs = require('fs');
const path = require('path');
const { Buffer } = require('buffer');
const { randomUUID } = require('crypto');

contextBridge.exposeInMainWorld('electronApi', {
    on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),
    send: (channel, data) => ipcRenderer.send(channel, data),
    fs: fs,
    path: path,
    createBuffer: (base64) => Buffer.from(base64, 'base64'),
    cwd: () => process.cwd(),
    pathJoin: (...args) => path.join(...args),
    main: {
        isOSX: () => process.platform === 'darwin',
        isWindows: () => process.platform === 'win32',
        isLinux: () => /linux/.test(process.platform),
        openScreenSecurity: () => ipcRenderer.invoke('electronMain:openScreenSecurity'),
        getScreenAccess: () => ipcRenderer.invoke('electronMain:getScreenAccess'),
        getScreenSources: () => ipcRenderer.invoke('electronMain:screen:getSources'),
    },
    openDirectory: (directoryPath) => {
        shell.openPath(directoryPath)
            .then((result) => {
                if (result) {
                    console.error(`Failed to open directory: ${result}`);
                } else {
                    console.log(`Opened directory: ${directoryPath}`);
                }
            })
            .catch((error) => {
                console.error(`Error opening directory: ${error}`);
            });
    },
    getWindowName: () => localStorage.getItem('selectedWindowName') || '',
    setWindowName: (windowName) => localStorage.setItem('selectedWindowName', windowName),
    getCurrentGamePath: () => localStorage.getItem('pathVariable') || '',  // Function to get the path variable from local storage
    setCurrentGamePath: (path) => localStorage.setItem('pathVariable', path),  // Function to set the path variable in local storage
    matchStats: {
        getWins: () => {
            const wins = parseInt(localStorage.getItem('wins')) || 0;
            console.log(`Retrieved Wins: ${wins}`);
            return wins;
        },
        getLosses: () => {
            const losses = parseInt(localStorage.getItem('losses')) || 0;
            console.log(`Retrieved Losses: ${losses}`);
            return losses;
        },
        getDraws: () => {
            const draws = parseInt(localStorage.getItem('draws')) || 0;
            console.log(`Retrieved Draws: ${draws}`);
            return draws;
        },
        setWins: (value) => {
            console.log(`Setting Wins to: ${value}`);
            localStorage.setItem('wins', value);
        },
        setLosses: (value) => {
            console.log(`Setting Losses to: ${value}`);
            localStorage.setItem('losses', value);
        },
        setDraws: (value) => {
            console.log(`Setting Draws to: ${value}`);
            localStorage.setItem('draws', value);
        },
        incrementWins: () => {
            const wins = parseInt(localStorage.getItem('wins')) || 0;
            console.log(`Incrementing Wins. New value: ${wins + 1}`);
            localStorage.setItem('wins', wins + 1);
        },
        incrementLosses: () => {
            const losses = parseInt(localStorage.getItem('losses')) || 0;
            console.log(`Incrementing Losses. New value: ${losses + 1}`);
            localStorage.setItem('losses', losses + 1);
        },
        incrementDraws: () => {
            const draws = parseInt(localStorage.getItem('draws')) || 0;
            console.log(`Incrementing Draws. New value: ${draws + 1}`);
            localStorage.setItem('draws', draws + 1);
        },
        generateMatchGUID: () => {
            const matchGUID = randomUUID();
            console.log(`Generated Match GUID: ${matchGUID}`);
            localStorage.setItem('matchGUID', matchGUID);
            return matchGUID;
        },
        getMatchGUID: () => {
            const matchGUID = localStorage.getItem('matchGUID');
            console.log(`Retrieved Match GUID: ${matchGUID}`);
            return matchGUID;
        },
        generateAndSetEpochTimestamp: () => {
            const epochTimestamp = Math.floor(Date.now() / 1000);
            console.log(`Generated Epoch Timestamp: ${epochTimestamp}`);
            localStorage.setItem('epochTimestamp', epochTimestamp);
            return epochTimestamp;
        },
        getEpochTimestamp: () => {
            const epochTimestamp = localStorage.getItem('epochTimestamp');
            console.log(`Retrieved Epoch Timestamp: ${epochTimestamp}`);
            return epochTimestamp;
        },
            // Functions for handling start time
        generateAndSetStartTime: () => {
            const startTime = Math.floor(Date.now() / 1000); // Get current epoch time
            console.log(`Generated Start Time: ${startTime}`);
            localStorage.setItem('startTime', startTime); // Store in localStorage
            return startTime;
        },
        getStartTime: () => {
            const startTime = localStorage.getItem('startTime');
            console.log(`Retrieved Start Time: ${startTime}`);
            return startTime;
        },
        // Functions for handling end time
        generateAndSetEndTime: () => {
            const endTime = Math.floor(Date.now() / 1000); // Get current epoch time
            console.log(`Generated End Time: ${endTime}`);
            localStorage.setItem('endTime', endTime); // Store in localStorage
            return endTime;
        },
        getEndTime: () => {
            const endTime = localStorage.getItem('endTime');
            console.log(`Retrieved End Time: ${endTime}`);
            return endTime;
        },
        generateAndSetFormattedDate: () => {
            const now = new Date();
            const month = String(now.getMonth() + 1).padStart(2, '0'); // Add 1 because months are zero-indexed
            const day = String(now.getDate()).padStart(2, '0');
            const year = now.getFullYear();
            const formattedDate = `${month}${day}${year}`;
            
            console.log(`Generated Formatted Date: ${formattedDate}`);
            localStorage.setItem('formattedDate', formattedDate);
            return formattedDate;
        },
        getFormattedDate: () => {
            const formattedDate = localStorage.getItem('formattedDate');
            console.log(`Retrieved Formatted Date: ${formattedDate}`);
            return formattedDate;
        },
        getNextPaddedPictureNumber: (length = 4) => {
            let pictureCounter = parseInt(localStorage.getItem('pictureCounter')) || 0; // Retrieve from localStorage
            
            // Inline string padding logic
            const paddedPictureNumber = String(pictureCounter).padStart(length, '0');
            
            pictureCounter++; // Increment the counter
            localStorage.setItem('pictureCounter', pictureCounter); // Store back in localStorage
            console.log(`Generated Next Padded Picture Number: ${paddedPictureNumber}`);
            return paddedPictureNumber;
        },
        setPaddedPictureNumber: (value) => {
            console.log(`Setting Picture Number to: ${value}`);
            localStorage.setItem('pictureCounter', value);
        },


    },
});
