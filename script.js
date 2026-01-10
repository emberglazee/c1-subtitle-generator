// Configuration & Constants
const STYLES = [
    { value: 'pw', name: 'Project Wingman', font: 'Roboto' },
    { value: 'ac7', name: 'Ace Combat 7', font: 'Aces07' },
    { value: 'acz', name: 'Ace Combat Zero', font: 'Frutiger' },
    { value: 'hd2', name: 'Helldivers 2', font: 'FSSinclair' }
];

const GRADIENTS = {
    trans: ['#55CDFC', '#F7A8B8', '#FFFFFF', '#F7A8B8', '#55CDFC'],
    rainbow: ['#FF0000', '#FFA500', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'],
    italian: ['#009246', '#FFFFFF', '#CE2B37'],
    french: ['#0055A4', '#FFFFFF', '#EF4135']
};

const GRADIENT_OPTIONS = [
    { value: 'none', name: 'None' },
    { value: 'trans', name: '🏳️‍⚧️ Trans Flag' },
    { value: 'rainbow', name: '🏳️‍🌈 LGBTQ Flag' },
    { value: 'italian', name: '🇮🇹 Italian Flag' },
    { value: 'french', name: '🇫🇷 French Flag' }
];

const COLORS = {
    basic: [
        { name: 'Red', hex: '#FF5555' },
        { name: 'Orange', hex: '#FFA500' },
        { name: 'Yellow', hex: '#FFFF55' },
        { name: 'Lime', hex: '#32CD32' },
        { name: 'Green', hex: '#55FF55' },
        { name: 'Cyan', hex: '#55FFFF' },
        { name: 'Blue', hex: '#5555FF' },
        { name: 'Navy', hex: '#000080' },
        { name: 'Purple', hex: '#8A2BE2' },
        { name: 'Pink', hex: '#FF55FF' },
        { name: 'Brown', hex: '#A52A2A' },
        { name: 'Teal', hex: '#008080' },
        { name: 'Gray', hex: '#B0B0B0' },
        { name: 'White', hex: '#FFFFFF' }
    ],
    roles: [
        { name: 'Priority Red', hex: '#FF0000' },
        { name: 'Hostile Red', hex:'#e74c3c' },
        { name: 'Peacekeeper Red', hex: '#992D22' },
        { name: 'The Home Depot Orange', hex: '#F96302' },
        { name: 'FakeDev Orange', hex: '#E67E22' },
        { name: '⭐ Yellow', hex: '#fdb401' },
        { name: 'Mad Yellow', hex: '#f1c40f' },
        { name: 'Wikiyellow', hex: '#FFB40B' },
        { name: 'Mercenary Yellow', hex: '#BBAD2C' },
        { name: 'Faust/Goblin Green', hex: '#1F8b4C' },
        { name: 'PWcord Moderator Turquoise', hex: '#1ABC9C' },
        { name: 'Cascadian Teal', hex: '#2BBCC2' },
        { name: 'Voice Actor Blue', hex: '#86A4C7' },
        { name: 'Friendly Blue', hex: '#3498db' },
        { name: 'Federation Dark Blue', hex: '#0C0D3B' },
        { name: 'Ridel Purple', hex: '#71368A' },
        { name: 'Gremlin Pink', hex: '#ff00dc' },
        { name: 'Mugged Pink', hex: '#FFABF3' },
        { name: 'Potato Brown', hex: '#c8a186' }
    ],
    characters: [
        { name: 'Ikuyo Red', hex: '#d8615d' },
        { name: 'Nijika Yellow', hex: '#f8dc88' },
        { name: 'Bocchi Pink', hex: '#f5b2c4' },
        { name: 'Kikuri Pink', hex: '#8e577a' },
        { name: 'Ryo Blue', hex: '#5378af' }
    ]
};

const CONFIG = {
    fontSize: 48,
    padding: 40,
    minWidth: 1024,
    maxWidth: 2048,
    arrowQuoteWidth: 80
};

// UI Elements
const els = {
    style: document.getElementById('style'),
    speaker: document.getElementById('speaker'),
    quote: document.getElementById('quote'),
    colorPicker: document.getElementById('colorPicker'),
    colorText: document.getElementById('colorText'),
    colorPreset: document.getElementById('colorPreset'),
    gradient: document.getElementById('gradient'),
    stretch: document.getElementById('stretchGradient'),
    continuous: document.getElementById('continuousGradient'),
    autoGenerate: document.getElementById('autoGenerate'),
    btn: document.getElementById('generateBtn'),
    dlBtn: document.getElementById('downloadBtn'),
    canvas: document.getElementById('canvas')
};

// Sync color inputs
els.colorPicker.addEventListener('input', (e) => {
    els.colorText.value = e.target.value;
});
els.colorText.addEventListener('input', (e) => {
    els.colorPicker.value = e.target.value;
});

// Helper: Measure word width (Simplified for browser - no custom emoji parsing)
function measureWordWidth(ctx, word) {
    return ctx.measureText(word).width;
}

// Logic: Wrap Text
function wrapText(ctx, text, maxWidth) {
    const lines = [];
    text.split('\n').forEach(textLine => {
        textLine.split(' ').forEach((word, i) => {
            const wordWidth = measureWordWidth(ctx, word);
            
            // If a single word is too long, we might need to break it, 
            // but for simplicity in subtitle logic, we usually just wrap.
            
            // Check if adding this word exceeds max width
            const lastLineIndex = lines.length - 1;
            const isFirstWordOfBlock = i === 0;
            
            if (lines.length === 0 || isFirstWordOfBlock) {
                // Start a new line
                lines.push(word);
            } else {
                const testLine = `${lines[lastLineIndex]} ${word}`;
                const testWidth = measureWordWidth(ctx, testLine);
                
                if (testWidth <= maxWidth) {
                    lines[lastLineIndex] = testLine;
                } else {
                    lines.push(word);
                }
            }
        });
    });
    return lines;
}

// Main Generation Function
async function generateSubtitle() {
    const style = els.style.value;
    const speaker = els.speaker.value;
    const quote = els.quote.value;

    const selectedColorType = document.querySelector('input[name="colorType"]:checked').value;
    let color;
    switch (selectedColorType) {
        case 'preset':
            color = els.colorPreset.value;
            break;
        case 'custom':
        default:
            color = els.colorText.value;
            break;
    }

    const gradientType = selectedColorType === 'gradient' ? els.gradient.value : 'none';

    const stretch = els.stretch.checked;
    const continuous = els.continuous.checked;

    // Font selection
    const styleInfo = STYLES.find(s => s.value === style);
    const fontFamily = styleInfo.font;

    // Ensure fonts are loaded
    await document.fonts.ready;

    const ctx = els.canvas.getContext('2d');
    
    // Setup initial font for measurement
    const baseFontSize = (style === 'hd2') ? 48 : CONFIG.fontSize;
    ctx.font = `${baseFontSize}px ${fontFamily}`;

    // Calculate dimensions
    const isArrowStyle = style === 'ac7' || style === 'acz';
    const extraWidth = isArrowStyle ? CONFIG.arrowQuoteWidth : 0;
    
    // Simple width calculation based on text length
    const speakerWidth = ctx.measureText(speaker).width;
    const quoteWidth = ctx.measureText(quote).width; // Rough estimate before wrapping
    
    // Calculate effective width for wrapping
    // We want to target a canvas width between min and max
    let canvasWidth = Math.max(CONFIG.minWidth, Math.min(Math.max(speakerWidth, quoteWidth) + CONFIG.padding * 2 + extraWidth, CONFIG.maxWidth));
    const effectiveMaxWidth = canvasWidth - (CONFIG.padding * 2) - extraWidth;

    // Wrap lines
    const speakerLines = wrapText(ctx, speaker, effectiveMaxWidth);
    const quoteLines = wrapText(ctx, quote, effectiveMaxWidth);

    const lineHeight = baseFontSize * 1.2;
    
    // Calculate Height
    let canvasHeight = 50 + (speakerLines.length * lineHeight) + 2 + (quoteLines.length * lineHeight) + CONFIG.padding;
    
    // HD2 has specific layout logic
    if (style === 'hd2') {
        // HD2 specific sizing logic
        const hd2FontSize = Math.floor(canvasWidth * 0.025);
        const hd2LineHeight = hd2FontSize * 1.6;
        const hd2TextPadding = Math.floor(hd2FontSize * 1.2);
        const hd2SpeakerTextGap = Math.floor(hd2FontSize * 0.75);
        
        ctx.font = `${hd2FontSize}px ${fontFamily}`; // Re-measure for HD2
        const hd2SpeakerWidth = ctx.measureText(speaker).width;
        
        // Recalculate wrapping for HD2 specifically
        const maxBoxWidth = canvasWidth * 0.8;
        const maxQuoteWidth = maxBoxWidth - hd2SpeakerWidth - hd2SpeakerTextGap - (hd2TextPadding * 2);
        
        // Wrap HD2 lines with new font size
        const hd2QuoteLines = [];
        let currentLine = '';
        quote.split(' ').forEach(word => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (ctx.measureText(testLine).width > maxQuoteWidth) {
                if(currentLine) hd2QuoteLines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        if(currentLine) hd2QuoteLines.push(currentLine);

        const boxHeight = hd2LineHeight * (1.2 + (hd2QuoteLines.length > 1 ? 0.4 * (hd2QuoteLines.length - 1) : 0)) +
                (hd2QuoteLines.length > 1 ? (hd2QuoteLines.length - 1) * 10 : 0);
        
        // Resize canvas for HD2
        canvasWidth = 2048; // HD2 usually looks better on wide canvas
        canvasHeight = 400; // Fixed-ish height
        els.canvas.width = canvasWidth;
        els.canvas.height = canvasHeight;
        
        // Draw HD2
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.font = `${hd2FontSize}px ${fontFamily}`;
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';
        
        // Calculate Box Box
        const maxTextWidth = Math.max(...hd2QuoteLines.map(l => ctx.measureText(l).width));
        const totalBoxWidth = hd2SpeakerWidth + hd2SpeakerTextGap + maxTextWidth + (hd2TextPadding * 2);
        const boxX = (canvasWidth - totalBoxWidth) / 2;
        const boxY = (canvasHeight * 0.6) - (boxHeight / 2);

        // Black Box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(boxX, boxY, totalBoxWidth, boxHeight);

        // Speaker
        ctx.fillStyle = gradientType === 'none' ? '#FFE81F' : color; 
        // (Skipping complex gradient logic for HD2 speaker for simplicity, usually yellow)
        const speakerX = boxX + hd2TextPadding;
        const baselineOffset = Math.floor(hd2LineHeight * 0.65);
        ctx.fillText(speaker, speakerX, boxY + baselineOffset);

        // Text
        ctx.fillStyle = 'white';
        const textX = speakerX + hd2SpeakerWidth + hd2SpeakerTextGap;
        let currentY = boxY + baselineOffset;
        
        hd2QuoteLines.forEach(line => {
            ctx.fillText(line, textX, currentY);
            currentY += hd2LineHeight * 0.4 + 14;
        });

        return; // End HD2
    }

    // Standard Styles (AC7, PW, ACZ)
    els.canvas.width = canvasWidth;
    els.canvas.height = canvasHeight;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    ctx.font = `${baseFontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 8;

    const centerX = canvasWidth / 2;
    let y = 50;

    // Draw Speaker
    const gradientColors = GRADIENTS[gradientType];

    if (gradientType === 'none') {
        ctx.fillStyle = color;
        speakerLines.forEach(line => {
            ctx.fillText(line, centerX, y);
            y += lineHeight;
        });
    } else {
        // New, clearer gradient logic based on orthogonal stretch/continuous flags
        let charIndex = 0;

        speakerLines.forEach(line => {
            const lineWidth = ctx.measureText(line).width;
            if (lineWidth === 0) {
                y += lineHeight;
                return; // Skip empty lines
            }
            const lineXStart = centerX - lineWidth / 2;

            if (continuous) {
                // SMOOTH GRADIENT: Use a gradient or pattern for a single fillText call.
                let gradientFill;
                if (stretch) {
                    // Continuous + Stretched: A single smooth gradient stretched to the line's width.
                    const gradient = ctx.createLinearGradient(lineXStart, 0, lineXStart + lineWidth, 0);
                    gradientColors.forEach((c, i) => {
                        const stop = gradientColors.length > 1 ? i / (gradientColors.length - 1) : 0.5;
                        gradient.addColorStop(stop, c);
                    });
                    gradientFill = gradient;
                } else {
                    // Continuous + Not Stretched: A smooth, repeating gradient pattern.
                    const patternWidth = 150; // A fixed width for the repeating pattern cycle.
                    const patternCanvas = document.createElement('canvas');
                    patternCanvas.width = patternWidth;
                    patternCanvas.height = 1;
                    const pctx = patternCanvas.getContext('2d');
                    const pat = pctx.createLinearGradient(0, 0, patternWidth, 0);
                    gradientColors.forEach((c, i) => {
                        const stop = gradientColors.length > 1 ? i / (gradientColors.length - 1) : 0.5;
                        pat.addColorStop(stop, c);
                    });
                    pctx.fillStyle = pat;
                    pctx.fillRect(0, 0, patternWidth, 1);
                    gradientFill = ctx.createPattern(patternCanvas, 'repeat-x');
                }

                ctx.fillStyle = gradientFill;
                // We must translate the canvas for the repeating pattern to be aligned with the text.
                ctx.save();
                ctx.translate(lineXStart, 0);
                ctx.textAlign = 'left';
                ctx.fillText(line, 0, y);
                ctx.restore();

            } else {
                // PER-CHARACTER GRADIENT: Loop through each character and draw it individually.
                let currentX = lineXStart;
                ctx.textAlign = 'left';

                if (stretch) {
                    // Per-character + Stretched (DISCRETE): Pick solid colors from the palette, but distribute them across the line width.
                    for (let i = 0; i < line.length; i++) {
                        const char = line[i];
                        const charWidth = ctx.measureText(char).width;

                        // Calculate percentage position of the character's middle point
                        const percentage = (currentX + charWidth / 2 - lineXStart) / lineWidth;

                        // Use percentage to pick a discrete color index
                        let colorIndex = Math.floor(percentage * gradientColors.length);
                        // Clamp the index to be safe
                        colorIndex = Math.min(colorIndex, gradientColors.length - 1);

                        ctx.fillStyle = gradientColors[colorIndex];
                        ctx.fillText(char, currentX, y);
                        currentX += charWidth;
                    }
                } else {
                    // Per-character + Not Stretched: Standard repeating color palette.
                    for (let i = 0; i < line.length; i++) {
                        const char = line[i];
                        const colorIndex = (charIndex + i) % gradientColors.length;
                        ctx.fillStyle = gradientColors[colorIndex];
                        ctx.fillText(char, currentX, y);
                        currentX += ctx.measureText(char).width;
                    }
                }
                ctx.textAlign = 'center'; // Reset alignment
            }

            charIndex += line.length;
            y += lineHeight;
        });
    }

    // ACZ Separator
    if (style === 'acz') {
        const maxW = Math.max(...speakerLines.map(l => ctx.measureText(l).width));
        y += lineHeight / 4;
        ctx.fillStyle = color;
        ctx.fillRect(centerX - (maxW * 1.2 / 2), y, maxW * 1.2, 2);
        y += lineHeight / 2;
    }

    // Draw Quote
    ctx.fillStyle = (style === 'acz') ? color : 'white';
    y += 2;

    quoteLines.forEach((line, i) => {
        let lineX = centerX;
        
        // Arrows for AC7/ACZ
        if (isArrowStyle) {
            const lineWidth = ctx.measureText(line).width;
            const leftX = centerX - (lineWidth / 2) - 40;
            const rightX = centerX + (lineWidth / 2) + 40;

            if (i === 0) {
                ctx.save();
                ctx.fillStyle = (gradientType === 'none') ? color : gradientColors[0];
                ctx.fillText('<<', leftX, y);
                ctx.restore();
            }
            if (i === quoteLines.length - 1) {
                ctx.save();
                ctx.fillStyle = (gradientType === 'none') ? color : gradientColors[gradientColors.length - 1];
                ctx.fillText('>>', rightX, y);
                ctx.restore();
            }
        }

        ctx.fillText(line, lineX, y);
        y += lineHeight;
    });
}

function setupColorControls() {
    const colorTypeRadios = document.querySelectorAll('input[name="colorType"]');
    const customColorGroup = document.getElementById('customColor-group');
    const presetGroup = document.getElementById('preset-group');
    const gradientGroup = document.getElementById('gradient-group');
    const gradientOptionsGroup = document.querySelector('.checkbox-group');

    function updateColorControlVisibility() {
        const selectedType = document.querySelector('input[name="colorType"]:checked').value;

        customColorGroup.style.display = 'none';
        presetGroup.style.display = 'none';
        gradientGroup.style.display = 'none';
        gradientOptionsGroup.style.display = 'none';

        if (selectedType === 'custom') {
            customColorGroup.style.display = 'block';
        } else if (selectedType === 'preset') {
            presetGroup.style.display = 'block';
        } else if (selectedType === 'gradient') {
            gradientGroup.style.display = 'block';
            gradientOptionsGroup.style.display = 'flex';
        }
    }

    colorTypeRadios.forEach(radio => {
        radio.addEventListener('change', updateColorControlVisibility);
    });

    // Initial call
    updateColorControlVisibility();
}

function populateSelect(element, options, clear = false) {
    if (clear) {
        element.innerHTML = '';
    }
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.name;
        element.appendChild(option);
    });
}

function populateAllOptions() {
    populateSelect(els.style, STYLES, true);
    populateSelect(els.gradient, GRADIENT_OPTIONS, true);

    const presetEl = els.colorPreset;
    const createOptGroup = (label, colors) => {
        const group = document.createElement('optgroup');
        group.label = label;
        colors.forEach(color => {
            const option = document.createElement('option');
            option.value = color.hex;
            option.textContent = color.name;
            group.appendChild(option);
        });
        return group;
    };
    
    presetEl.appendChild(createOptGroup('Basic', COLORS.basic));
    presetEl.appendChild(createOptGroup('Roles', COLORS.roles));
    presetEl.appendChild(createOptGroup('Characters', COLORS.characters));
}

function handleAutoGenerate() {
    if (els.autoGenerate.checked) {
        generateSubtitle();
    }
}

// Helper for stretched, per-character gradients
function getColorFromVirtualGradient(colors, percentage) {
    // Failsafe for bad inputs
    if (!colors || colors.length === 0) return '#FFFFFF'; // Return white on error
    if (colors.length === 1) return colors[0];

    // Clamp percentage to the valid range [0, 1] to prevent out-of-bounds errors
    const p = Math.max(0, Math.min(1, percentage));

    // Determine which two colors to interpolate between
    const colorStop = p * (colors.length - 1);
    const startIndex = Math.floor(colorStop);
    const endIndex = Math.min(startIndex + 1, colors.length - 1);
    
    // Determine the interpolation amount between the two colors
    const interpAmount = colorStop - startIndex;

    const startColor = colors[startIndex];
    const endColor = colors[endIndex];

    // This should not happen with the clamping, but as a guard:
    if (!startColor || !endColor) return '#FFFFFF';

    // Interpolation logic
    const sR = parseInt(startColor.substring(1, 3), 16);
    const sG = parseInt(startColor.substring(3, 5), 16);
    const sB = parseInt(startColor.substring(5, 7), 16);

    const eR = parseInt(endColor.substring(1, 3), 16);
    const eG = parseInt(endColor.substring(3, 5), 16);
    const eB = parseInt(endColor.substring(5, 7), 16);

    const iR = Math.floor(sR + (eR - sR) * interpAmount);
    const iG = Math.floor(sG + (eG - sG) * interpAmount);
    const iB = Math.floor(sB + (eB - sB) * interpAmount);

    // Convert back to hex
    const r = iR.toString(16).padStart(2, '0');
    const g = iG.toString(16).padStart(2, '0');
    const b = iB.toString(16).padStart(2, '0');
    
    return `#${r}${g}${b}`;
}

function setupAutoGenerate() {
    const toggleGenerateButton = () => {
        els.btn.style.display = els.autoGenerate.checked ? 'none' : 'block';
    };

    els.autoGenerate.addEventListener('change', () => {
        toggleGenerateButton();
        handleAutoGenerate();
    });

    Object.values(els).forEach(element => {
        if (element.id !== 'generateBtn' && element.id !== 'downloadBtn' && element.id !== 'autoGenerate') {
             const event = (element.type === 'text' || element.type === 'textarea') ? 'input' : 'change';
            element.addEventListener(event, handleAutoGenerate);
        }
    });

    document.querySelectorAll('input[name="colorType"]').forEach(radio => {
        radio.addEventListener('change', handleAutoGenerate);
    });
    
    toggleGenerateButton();
}


// Event Listeners
els.btn.addEventListener('click', generateSubtitle);

els.dlBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `subtitle-${Date.now()}.png`;
    link.href = els.canvas.toDataURL();
    link.click();
});

// Initial load
window.onload = () => {
    populateAllOptions();
    setupColorControls();
    setupAutoGenerate();
    generateSubtitle();
};
