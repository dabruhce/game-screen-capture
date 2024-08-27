const { contextBridge, ipcRenderer } = require('electron');
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
	main: {
		isOSX: () => process.platform === 'darwin',
		isWindows: () => process.platform === 'win32',
		isLinux: () => /linux/.test(process.platform),
		openScreenSecurity: () => ipcRenderer.invoke('electronMain:openScreenSecurity'),
		getScreenAccess: () => ipcRenderer.invoke('electronMain:getScreenAccess'),
		getScreenSources: () => ipcRenderer.invoke('electronMain:screen:getSources'),
	},
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
    },
});
