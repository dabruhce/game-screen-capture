const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

// Ensure the build directory exists at the root level of the project
const buildDir = path.join(__dirname, '../build');
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir);
}

// Function to load coordinates from a JSON file
function loadCoordinates(filePath) {
    const rawData = fs.readFileSync(filePath);
    return JSON.parse(rawData);
}

// Function to perform OCR on a specific region
async function performOCROnRegion(imagePath, region, regionName) {
    const worker = await Tesseract.createWorker();

    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    // Load the image using Jimp and preprocess it
    const img = await Jimp.read(imagePath);
    const preprocessedImage = img
        .greyscale() // Convert to grayscale
        .contrast(1) // Increase contrast
        .normalize(); // Normalize the image

    // Get image dimensions
    const imgWidth = preprocessedImage.bitmap.width;
    const imgHeight = preprocessedImage.bitmap.height;

    // Ensure crop dimensions are within image bounds
    const cropLeft = Math.max(0, region.from[0]);
    const cropTop = Math.max(0, region.from[1]);
    const cropWidth = Math.min(region.size[0], imgWidth - cropLeft);
    const cropHeight = Math.min(region.size[1], imgHeight - cropTop);

    // Log the crop dimensions for debugging
    console.log(`Cropping region (${regionName}): left=${cropLeft}, top=${cropTop}, width=${cropWidth}, height=${cropHeight}`);

    // Crop the image to the region of interest
    const croppedImage = preprocessedImage.crop(cropLeft, cropTop, cropWidth, cropHeight);

    // Save the cropped portion of the image in the build directory
    const croppedImagePath = path.join(buildDir, `cropped_${regionName}.png`);
    await croppedImage.writeAsync(croppedImagePath);
    console.log(`Cropped image saved as ${croppedImagePath}`);

    // Get the image as a buffer (to pass to Tesseract.js)
    const buffer = await croppedImage.getBufferAsync(Jimp.MIME_PNG);

    // Perform OCR
    const { data: { text, confidence } } = await worker.recognize(buffer, {
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', // Whitelist certain characters
        preserve_interword_spaces: 1, // Preserve spaces between words
    });

    console.log(`Parsed Text (${regionName}): \n`, text);
    console.log(`Confidence (${regionName}): `, confidence);

    // Write the extracted text to a file in the build directory
    const textFilePath = path.join(buildDir, `parsed_text_${regionName}.txt`);
    fs.writeFileSync(textFilePath, text);

    await worker.terminate();
}

async function runOCR() {
    const imagePath = './tests/example.png';
    const coordinates = loadCoordinates('./data/coordinates.json'); // Load coordinates from JSON

    // Define regions to process based on loaded coordinates
    const regions = {
        alliesName: coordinates.scoreboard.allies.name,
        enemiesName: coordinates.scoreboard.enemies.name,
        matchTime: coordinates.match.time,
        // Add more regions as needed
    };

    // Loop through each region and perform OCR
    for (const [regionName, region] of Object.entries(regions)) {
        await performOCROnRegion(imagePath, region, regionName);
    }
}

runOCR().then(() => {
    console.log('OCR processing complete.');
}).catch(err => {
    console.error('Error during OCR processing:', err);
});
