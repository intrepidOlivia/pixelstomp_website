function extractParagraphs(text) {
    let paragraphs = [];
    if (detectHTML(text)) {
        // Extract text from <p> tags
        const match = text.matchAll(/<.+?>/g);
        const matchArray = Array.from(match);
        let pindex = null;
        for (let m of matchArray) {
            if (m[0].includes('<p')) {
                pindex = m.index + m[0].length; // Set cursor to start of the paragraph's content
            }
            if (m[0].includes('/p>')) {
                paragraphs.push(text.slice(pindex, m.index));
            }
            if (m[0].includes('<hr')) {
                let prev = paragraphs[paragraphs.length - 1];
                if (prev !== undefined) {
                    paragraphs[paragraphs.length - 1] = prev.concat(m[0]);
                }
            }
        }

        // If there were no <p> tags, try extracting by the StartFragment tag
        if (paragraphs.length < 1) {
            for (let m of matchArray) {
                if (m[0] === "<!--StartFragment-->") {
                    pindex = m.index + 20;
                }
                if (m[0] === "<!--EndFragment-->") {
                    paragraphs.push(text.slice(pindex, m.index));
                }
            }
        }

        // If even that doesn't work, just put the blob of text in.
        if (paragraphs.length < 1) {
            paragraphs = text.split(WHITESPACE);
        }

    } else {
        paragraphs = text.split(WHITESPACE);
    }
    return paragraphs;
}

function detectHTML(text) {
    HTMLPattern = new RegExp('<(.*)>.*?|<(.*) />', 'g');
    return HTMLPattern.test(text);
}
