const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create the output directory if it doesn't exist
const outputDir = path.join(__dirname, 'src', 'styles');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Run Tailwind CLI to build the CSS
try {
    console.log('Building Tailwind CSS...');
    execSync('npx tailwindcss -i ./src/styles/input.css -o ./src/styles/main.css --minify');
    console.log('Tailwind CSS built successfully!');
} catch (error) {
    console.error('Error building Tailwind CSS:', error.message);
    process.exit(1);
}
