/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */
const { fs, path, createBuffer, on, send, main, openDirectory } = window.electronApi;
const video = document.querySelector('#stream');
const startBtn = document.querySelector('#start');
const stopBtn = document.querySelector('#stop');
const openSettingsBtn = document.querySelector('#system-preferences');
const screenPicker = document.querySelector('#electron-screen-picker');

const matchstartBtn = document.querySelector('#matchstart');

const recordWinBtn = document.querySelector('#recordWin');
const recordLossBtn = document.querySelector('#recordLoss');
const recordDrawBtn = document.querySelector('#recordDraw');

// Access the match stats from the exposed API
const wins = window.electronApi.matchStats.getWins();
const losses = window.electronApi.matchStats.getLosses();
const draws = window.electronApi.matchStats.getDraws();
const resetStatsBtn = document.querySelector('#resetStats');
const openDirectoryBtn = document.getElementById('open-directory-btn');

const displayMediaOptions = {
	video: {
		displaySurface: "window",
	},
	audio: false,
};

navigator.mediaDevices.getDisplayMedia = getDisplayMedia;

// Set event listeners for the start, stop and openSettings buttons
startBtn.addEventListener("click", startCapture, false);
stopBtn.addEventListener("click", stopCapture, false);
openSettingsBtn.addEventListener("click", openPreferences, false);
//matchstartBtn.addEventListener("click", startMatch, false);

recordWinBtn.addEventListener("click", recordWin, false);
recordLossBtn.addEventListener("click", recordLoss, false);
recordDrawBtn.addEventListener("click", recordDraw, false);
openDirectoryBtn.addEventListener("click", openDirectoryInExplorer, false);
resetStatsBtn.addEventListener("click", resetStats, false);

document.getElementById('resizeOverlayBtn').addEventListener('click', () => {
    const newWidth = parseInt(document.getElementById('newWidth').value, 10);
    const newHeight = parseInt(document.getElementById('newHeight').value, 10);

    // Check if the width and height are valid numbers
    if (!isNaN(newWidth) && !isNaN(newHeight)) {
        // Send a message to the main process to update the overlay size
        window.electronApi.invoke('electronMain:updateOverlaySize', newWidth, newHeight)
            .then(() => console.log(`Overlay size update requested: ${newWidth}x${newHeight}`))
            .catch(err => console.error('Failed to update overlay size:', err));
    } else {
        console.error('Invalid width or height');
    }
});

document.getElementById('moveOverlayBtn').addEventListener('click', () => {
    const newX = parseInt(document.getElementById('newX').value, 10);
    const newY = parseInt(document.getElementById('newY').value, 10);

    if (!isNaN(newX) && !isNaN(newY)) {
        window.electronApi.updateOverlayPosition(newX, newY)
            .then(() => console.log(`Overlay position update requested: X=${newX}, Y=${newY}`))
            .catch(err => console.error('Failed to update overlay position:', err));
    } else {
        console.error('Invalid X or Y position');
    }
});

document.addEventListener('DOMContentLoaded', () => {
 //   window.electronApi.getConfig().then((config) => {
 //       console.log('Loaded config:', config);

 //   });
});



async function startMatch() {

	const dateFolder = window.electronApi.matchStats.generateAndSetFormattedDate();
	const targetFolderPath = path.join(globalFolderBase, `${dateFolder}`);
    await createFolder(targetFolderPath);
    globalFolderPath = targetFolderPath;
    createMatchFolder(targetFolderPath);

}


async function openDirectoryInExplorer() {
    // Define the directory path you want to open
    const directoryPath = window.electronApi.getCurrentGamePath(); // Replace with your desired directory path

    // Check if the openDirectory function is available on electronApi
    if (window.electronApi && typeof window.electronApi.openDirectory === 'function') {
        // Use the exposed function from electronApi to open the directory
        window.electronApi.openDirectory(directoryPath);
        console.log(`Opened Directory: ${directoryPath}`);
    } else {
        console.error('openDirectory function is not available on window.electronApi');
    }

    // Additional logic can be added here if needed
    // await someOtherFunction();
}

async function recordWin() {
    window.electronApi.matchStats.incrementWins();
    console.log(`Win recorded. Total Wins: ${window.electronApi.matchStats.getWins()}`);
	await createMatchFolder(globalFolderPath);
}

async function recordLoss() {
    window.electronApi.matchStats.incrementLosses();
    console.log(`Loss recorded. Total Losses: ${window.electronApi.matchStats.getLosses()}`);
	await createMatchFolder(globalFolderPath);
}

async function recordDraw() {
    window.electronApi.matchStats.incrementDraws();
    console.log(`Draw recorded. Total Draws: ${window.electronApi.matchStats.getDraws()}`);
	await createMatchFolder(globalFolderPath);
}

async function resetStats() {
    window.electronApi.matchStats.setWins(0);
    window.electronApi.matchStats.setLosses(0);
    window.electronApi.matchStats.setDraws(0);
    console.log("Match stats reset. Wins, Losses, and Draws are now 0.");
}

let globalMatchCounter = 1; // Global counter to keep track of the current match number
let globalMatchPictureCounter = 1; // Global counter to keep track of the current picture number within a match

function padNumber(number, length) {
    return String(number).padStart(length, '0');
}

function getNextPaddedMatchNumber(length = 4) {
    const paddedMatchNumber = padNumber(globalMatchCounter, length);
    globalMatchCounter++; // Increment the global match counter for the next call
    return paddedMatchNumber;
}

function getNextPaddedPictureNumber(length = 4) {
    const paddedPictureNumber = padNumber(globalMatchPictureCounter, length);
    globalMatchPictureCounter++; // Increment the global picture counter for the next call
    return paddedPictureNumber;
}

const globalFolderBase = window.electronApi.pathJoin(window.electronApi.cwd(), 'screenshots');
let globalFolderPath = '';
let selectedWindowName = ''; // Global variable to store the selected window name
//let globalMatchFolderPath = ''
//let globalMatchId = 'inital'; // Global variable to store the match ID

function getFormattedDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${selectedWindowName}-${year}${month}${day}`;
}

async function createFolder(targetPath) {
    try {
        await fs.promises.mkdir(targetPath, { recursive: true });
        console.log(`Folder created at: ${targetPath}`);
    } catch (error) {
        console.error(`Error creating folder at ${targetPath}:`, error);
    }
}

async function createMatchFolder(targetPath) {
	//reset padded picture number for screenshots
	window.electronApi.matchStats.generateAndSetEndTime();
	window.electronApi.matchStats.setPaddedPictureNumber(0);

	//TODO generate match stats

	const matchStartTime = window.electronApi.matchStats.generateAndSetStartTime();
	const matchWindowName = window.electronApi.getWindowName();
	const localPath = path.join(targetPath, `${matchWindowName}_${matchStartTime}`);

	window.electronApi.setCurrentGamePath(localPath)
	
	//globalMatchFolderPath = localPath;
	createFolder(window.electronApi.getCurrentGamePath());
}

on('trigger-screenshot', async () => {
    console.log("Received request to take a screenshot");
    await takeScreenshot();
});

//TODO deprecate
on('trigger-create-match', async () => {
    console.log("Received request to create a match folder");
    await createMatchFolder(globalFolderPath);
});


async function takeScreenshot() {
    console.log("Taking screenshot...");

    // Ensure the video element is available
    if (!video) {
        console.error("Video element not found!");
        return;
    }

    // Create a canvas element to draw the video frame
    const videoCanvas = document.createElement('canvas');
    videoCanvas.width = video.videoWidth;
    videoCanvas.height = video.videoHeight;

    const ctx = videoCanvas.getContext('2d');
    ctx.drawImage(video, 0, 0, videoCanvas.width, videoCanvas.height);

    // Convert the canvas content to a Data URL (base64 encoded image)
    const imgDataUrl = videoCanvas.toDataURL('image/png');

    // Save the image to a file
    saveImageToFile(imgDataUrl);
}

async function saveImageToFile(dataUrl) {

    console.log("Saving image to file...");
	const screenshotCounter = window.electronApi.matchStats.getNextPaddedPictureNumber();
	console.log("Saving image to file..." + screenshotCounter);
    const filename = `screenshot-${screenshotCounter}.png`;

    // Convert Data URL to Buffer
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
   // const imgBuffer = Buffer.from(base64Data, 'base64');
   const imgBuffer = createBuffer(base64Data);  // Use the exposed function to create Buffer

    // Adjust the path as needed
    const savePath = path.join(window.electronApi.getCurrentGamePath(), filename);

    try {
        // Save the Buffer to a file
        await fs.promises.writeFile(savePath, imgBuffer);
        console.log(`Screenshot saved to ${savePath}`);
    } catch (error) {
        console.error('Failed to save the screenshot:', error);
    }
}

async function startCapture() {
    console.log("capturing");
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
        video.srcObject = stream;

        // Get the video track from the stream
        const videoTrack = stream.getVideoTracks()[0];

        // Get the settings of the video track to determine the width and height
        const { width, height } = videoTrack.getSettings();
        console.log(`Selected screen dimensions: ${width}x${height}`);

        // Hide the start button and show the stop button
        startBtn.classList = 'hidden';
        stopBtn.classList = '';
    } catch (err) {
        console.error(err);
    }
}

function stopCapture(evt) {
	if (!video.srcObject) return;
	
	let tracks = video.srcObject.getTracks();

	tracks.forEach((track) => track.stop());
	video.srcObject = null;
	startBtn.classList = '';
	stopBtn.classList = 'hidden';
}

function openPreferences() {
	main.openScreenSecurity();
}

let screenPickerOptions = {
	system_preferences: false
};

function getDisplayMedia() {
	if (main.isOSX()) {
		screenPickerOptions.system_preferences = true;
	}

	return new Promise(async (resolve, reject) => {
		let has_access = await main.getScreenAccess();
		if (!has_access) {
			return reject('none');
		}

		try {
			const sources = await main.getScreenSources();
			screenPickerShow(sources, async (id) => {
				try {
					const source = sources.find(source => source.id === id);
					if (!source) {
						return reject('none');
					}

					const stream = await window.navigator.mediaDevices.getUserMedia({
						audio: false,
						video: {
							mandatory: {
								chromeMediaSource: 'desktop',
								chromeMediaSourceId: source.id
							}
						}
					});
					resolve(stream);
				}
				catch (err) {
					reject(err);
				}
			}, {});
		}
		catch (err) {
			reject(err);
		}
	});
}

function screenPickerShow(sources, onselect) {
	const list = document.querySelector('#sources');
	list.innerHTML = '';

	sources.forEach(source => {
		const item = document.createElement('div');
		item.classList = '__electron-list';

		const wrapper = document.createElement('div');
		wrapper.classList = 'thumbnail __electron-screen-thumbnail';

		const thumbnail = document.createElement('img');
		thumbnail.src = source.thumbnailURL;

		const label = document.createElement('div');
		label.classList = '__electron-screen-name';
		label.innerText = source.name;

		wrapper.append(thumbnail);
		wrapper.append(label);
		item.append(wrapper);
		item.onclick = () => {
            selectedWindowName = source.name.split(' ')[0];
            console.log(`Selected window: ${selectedWindowName}`); // Log the selected window name for verification
			// Call startMatch function after a screen is selected
			window.electronApi.setWindowName(selectedWindowName);
			startMatch();
			onselect(source.id);
			MicroModal.close('electron-screen-picker');
		};
		list.append(item);
	});
	
	if (!screenPickerOptions.system_preferences) {
		openSettingsBtn.classList = 'hidden';
	}

	MicroModal.show('electron-screen-picker');
}
