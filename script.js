// Configuration & Constants
const GRADIENTS = {
    trans: ['#55CDFC', '#F7A8B8', '#FFFFFF', '#F7A8B8', '#55CDFC'],
    rainbow: ['#FF0000', '#FFA500', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'],
    italian: ['#009246', '#FFFFFF', '#CE2B37'],
    french: ['#0055A4', '#FFFFFF', '#EF4135']
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
    gradient: document.getElementById('gradient'),
    stretch: document.getElementById('stretchGradient'),
    continuous: document.getElementById('continuousGradient'),
    btn: document.getElementById('generateBtn'),
    dlBtn: document.getElementById('downloadBtn'),
    canvas: document.getElementById('canvas')
};

// Sync color inputs
els.colorPicker.addEventListener('input', (e) => els.colorText.value = e.target.value);
els.colorText.addEventListener('input', (e) => els.colorPicker.value = e.target.value);

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
    const color = els.colorText.value;
    const gradientType = els.gradient.value;
    const stretch = els.stretch.checked;
    const continuous = els.continuous.checked;

    // Font selection
    const fontMap = {
        'pw': 'Roboto',
        'ac7': 'Aces07',
        'acz': 'Frutiger',
        'hd2': 'FSSinclair'
    };
    const fontFamily = fontMap[style];

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
        if (stretch) {
            // Linear Gradient
            const maxLineWidth = Math.max(...speakerLines.map(l => ctx.measureText(l).width));
            const g = ctx.createLinearGradient(centerX - maxLineWidth/2, 0, centerX + maxLineWidth/2, 0);
            gradientColors.forEach((c, i) => {
                g.addColorStop(i / (gradientColors.length - 1), c);
            });
            ctx.fillStyle = g;
            speakerLines.forEach(line => {
                ctx.fillText(line, centerX, y);
                y += lineHeight;
            });
        } else {
            // Char by Char Gradient
            let charCount = 0;
            speakerLines.forEach(line => {
                const lineWidth = ctx.measureText(line).width;
                let currentX = centerX - (lineWidth / 2);
                
                for (let char of line) {
                    const idx = continuous ? charCount : Array.from(line).indexOf(char); // Simplified index logic
                    const colorIndex = (continuous ? charCount : line.indexOf(char)) % gradientColors.length;
                    
                    ctx.fillStyle = gradientColors[colorIndex];
                    ctx.textAlign = 'left'; // Temp switch for precise char placement
                    ctx.fillText(char, currentX, y);
                    currentX += ctx.measureText(char).width;
                    charCount++;
                }
                ctx.textAlign = 'center'; // Reset
                y += lineHeight;
            });
        }
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

// Event Listeners
els.btn.addEventListener('click', generateSubtitle);

els.dlBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `subtitle-${Date.now()}.png`;
    link.href = els.canvas.toDataURL();
    link.click();
});

// Initial load
window.onload = generateSubtitle;
