const Tesseract = require('tesseract.js');
const fs = require('fs');
const Jimp = require('jimp');

// Function to load coordinates from a JSON file
function loadCoordinates(filePath) {
    const rawData = fs.readFileSync(filePath);
    return JSON.parse(rawData);
}

// Function to perform OCR on a specific region
async function performOCROnRegion(imagePath, region, regionName) {

    const worker = await Tesseract.createWorker(options);

    // Load the image using Jimp
    const img = await Jimp.read(imagePath);
    
    // Get image dimensions
    const imgWidth = img.bitmap.width;
    const imgHeight = img.bitmap.height;

    // Ensure crop dimensions are within image bounds
    const cropLeft = Math.max(0, region.from[0]);
    const cropTop = Math.max(0, region.from[1]);
    const cropWidth = Math.min(region.size[0], imgWidth - cropLeft);
    const cropHeight = Math.min(region.size[1], imgHeight - cropTop);

    // Log the crop dimensions for debugging
    console.log(`Cropping region (${regionName}): left=${cropLeft}, top=${cropTop}, width=${cropWidth}, height=${cropHeight}`);

    // Crop the image to the region of interest
    const croppedImage = img.crop(cropLeft, cropTop, cropWidth, cropHeight);

    // Get the image as a buffer (to pass to Tesseract.js)
    const buffer = await croppedImage.getBufferAsync(Jimp.MIME_PNG);

    // Perform OCR
    const { data: { text, confidence } } = await worker.recognize(buffer);

    console.log(`Parsed Text (${regionName}): \n`, text);
    console.log(`Confidence (${regionName}): `, confidence);

    // Write the extracted text to a file
    fs.writeFileSync(`parsed_text_${regionName}.txt`, text);

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
    console.error(err);
});
