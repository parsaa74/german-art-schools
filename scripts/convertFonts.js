const opentype = require('opentype.js');
const fs = require('fs');
const path = require('path');

// Function to convert a TTF font to Three.js compatible JSON
function convertFontToJSON(ttfPath, outputPath) {
    try {
        console.log(`Converting ${ttfPath}...`);
        const font = opentype.loadSync(ttfPath);
        
        const fontData = {
            familyName: font.names.fullName.en,
            ascender: font.ascender,
            descender: font.descender,
            boundingBox: {
                yMin: font.tables.head.yMin,
                yMax: font.tables.head.yMax,
                xMin: font.tables.head.xMin,
                xMax: font.tables.head.xMax
            },
            resolution: 1000,
            glyphs: {}
        };

        // Convert glyphs object to array and process each glyph
        Object.values(font.glyphs.glyphs).forEach(glyph => {
            if (glyph.unicode !== undefined) {
                const char = String.fromCharCode(glyph.unicode);
                if (glyph.path) {
                    fontData.glyphs[char] = {
                        ha: glyph.advanceWidth ? glyph.advanceWidth : 0,
                        x_min: glyph.xMin || 0,
                        x_max: glyph.xMax || 0,
                        o: glyph.path.toPathData()
                    };
                }
            }
        });

        // Create output directory if it doesn't exist
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, JSON.stringify(fontData, null, 2));
        console.log(`Successfully converted ${ttfPath} to ${outputPath}`);
    } catch (error) {
        console.error(`Error converting ${ttfPath}:`, error.message);
    }
}

// Process Inter fonts
const interDir = path.join(__dirname, '..', 'Cinzel_Decorative,Inter', 'Inter');
const interFonts = [
    'Inter-VariableFont_opsz,wght.ttf',
    'Inter-Italic-VariableFont_opsz,wght.ttf'
];

interFonts.forEach(fontFile => {
    const ttfPath = path.join(interDir, fontFile);
    const outputName = fontFile.replace('.ttf', '.json');
    const outputPath = path.join(__dirname, '..', 'public', 'fonts', outputName);
    convertFontToJSON(ttfPath, outputPath);
});

// Process Cinzel Decorative fonts
const cinzelDir = path.join(__dirname, '..', 'Cinzel_Decorative,Inter', 'Cinzel_Decorative');
const cinzelFonts = [
    'CinzelDecorative-Regular.ttf',
    'CinzelDecorative-Bold.ttf',
    'CinzelDecorative-Black.ttf'
];

cinzelFonts.forEach(fontFile => {
    const ttfPath = path.join(cinzelDir, fontFile);
    const outputName = fontFile.replace('.ttf', '.json');
    const outputPath = path.join(__dirname, '..', 'public', 'fonts', outputName);
    convertFontToJSON(ttfPath, outputPath);
}); 