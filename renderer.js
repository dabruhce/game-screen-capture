/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */
const { fs, path, createBuffer, on, send, main } = window.electronApi;
const video = document.querySelector('#stream');
const startBtn = document.querySelector('#start');
const stopBtn = document.querySelector('#stop');
const openSettingsBtn = document.querySelector('#system-preferences');
const screenPicker = document.querySelector('#electron-screen-picker');

const matchstartBtn = document.querySelector('#matchstart');

const recordWinBtn = document.querySelector('#recordWin');
const recordLossBtn = document.querySelector('#recordLoss');
const recordDrawBtn = document.querySelector('#recordDraw');


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
matchstartBtn.addEventListener("click", startMatch, false);

recordWinBtn.addEventListener("click", recordWin, false);
recordLossBtn.addEventListener("click", recordLoss, false);
recordDrawBtn.addEventListener("click", recordDraw, false);


async function startMatch() {

	//quick and dirty way to start
    const epochTime = Date.now();
    const targetDateFolderPath = path.join(globalFolderBase, `${getFormattedDate()}_${epochTime}`);
    await createFolder(targetDateFolderPath);
    globalFolderPath = targetDateFolderPath;
    createMatchFolder(targetDateFolderPath);
	//takeScreenshot();
}

let matchStats = {
    wins: 0,
    losses: 0,
    draws: 0,
};

// Access the match stats from the exposed API
const wins = window.electronApi.matchStats.getWins();
const losses = window.electronApi.matchStats.getLosses();
const draws = window.electronApi.matchStats.getDraws();
const resetStatsBtn = document.querySelector('#resetStats');
resetStatsBtn.addEventListener("click", resetStats, false);

console.log(wins, losses, draws);

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

const globalFolderBase = path.join('C:', 'Users', 'bruce', 'Pictures', 'Screenshots');
let globalFolderPath = '';
let selectedWindowName = ''; // Global variable to store the selected window name
let globalMatchFolderPath = ''
let globalMatchId = 'inital'; // Global variable to store the match ID

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
	const matchGUID = window.electronApi.matchStats.generateMatchGUID();
	console.log(`New match started with GUID: ${matchGUID}`);
	const localPath = path.join(targetPath, getNextPaddedMatchNumber());
	globalMatchFolderPath = localPath;
	createFolder(localPath);
}

on('trigger-screenshot', async () => {
    console.log("Received request to take a screenshot");
    await takeScreenshot();
});

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
    const screenshotCounter = getNextPaddedPictureNumber();
    const filename = `screenshot-${screenshotCounter}.png`;

    // Convert Data URL to Buffer
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
   // const imgBuffer = Buffer.from(base64Data, 'base64');
   const imgBuffer = createBuffer(base64Data);  // Use the exposed function to create Buffer

    // Adjust the path as needed
    const savePath = path.join(globalMatchFolderPath, filename);

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
		video.srcObject = await navigator.mediaDevices.getDisplayMedia(
			displayMediaOptions
		);
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
