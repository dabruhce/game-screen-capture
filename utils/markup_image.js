const Jimp = require('jimp');
const path = require('path');
const fs = require('fs').promises;

async function markupImage() {
  try {
    // Image paths
    const readPath = './tests/example.png';
    const writeDir = './build/';
    const coordinatesPath = './data/coordinates.json';

    // Load the coordinates from the JSON file
    const coordinatesData = await fs.readFile(coordinatesPath, 'utf-8');
    const data = JSON.parse(coordinatesData);

    // Function to convert JSON structure to an array of rectangles
    const extractRectangles = (obj) => {
      let rectangles = [];

      for (let key in obj) {
        if (obj[key].from && obj[key].size) {
          const [x, y] = obj[key].from;
          const [width, height] = obj[key].size;
          rectangles.push({ x, y, width, height });
        }
        if (typeof obj[key] === 'object') {
          rectangles = rectangles.concat(extractRectangles(obj[key]));
        }
      }

      return rectangles;
    };

    const coordinates = extractRectangles(data);

    // Load the image
    const image = await Jimp.read(readPath);

    // Draw rectangles on the image
    coordinates.forEach(({ x, y, width, height }) => {
      image.scan(x, y, width, height, (dx, dy, idx) => {
        image.bitmap.data[idx + 0] = 255; // Red
        image.bitmap.data[idx + 1] = 0;   // Green
        image.bitmap.data[idx + 2] = 0;   // Blue
      });
    });

    // Prepare the output file path
    const { name, ext } = path.parse(readPath);
    const outputFilePath = path.join(writeDir, `${name}_markup${ext}`);

    // Save the marked-up image
    await image.writeAsync(outputFilePath);

    console.log(`Marked-up image saved to: ${outputFilePath}`);
  } catch (error) {
    console.error('Error processing image:', error);
  }
}

markupImage();
