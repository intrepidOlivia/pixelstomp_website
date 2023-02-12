/**
 * @param {string} text 
 * @returns {Array<string>}
 */
function extractParagraphs(text) {
    let paragraphs = [];
    if (detectHTML(text)) {
        // Extract text from <p> tags
        const match = text.matchAll(/<.+?>/g);
        const matchArray = Array.from(match);
        let pindex = null;
        for (let m of matchArray) {
            // Handle paragraphs
            if (m[0].includes('<p')) {
                pindex = m.index + m[0].length; // Set cursor to start of the paragraph's content
            }
            if (m[0].includes('/p>')) {
                paragraphs.push(text.slice(pindex, m.index));
            }

            // Handle line breaks
            if (m[0].includes('<hr')) {
                let prev = paragraphs[paragraphs.length - 1];
                if (prev !== undefined) {
                    paragraphs[paragraphs.length - 1] = prev.concat(m[0]);
                }
            }

            // Handle headers
            if (startsAHeader(m[0])) {
                // Handle <h1>, <h2>, <h3> etc
                pindex = m.index; // Set cursor to start of header's content
            }
            if (endsAHeader(m[0])) {
                paragraphs.push(text.slice(pindex, m.index + 5));
            }

            // Handle lists
            if (m[0].includes('<li')) {
                pindex = m.index + m[0].length;
            }
            if (m[0].includes('/li>')) {
                paragraphs.push(text.slice(pindex, m.index));
            }

            // Handle images
            if (m[0].includes('<amp-img')) {
                console.log('found an amp image!');
                pindex = m.index;
            }
            if (m[0].includes('/amp-img>')) {
                const ampImgTag = text.slice(pindex, m.index  + m[0].length);
                const parent = document.createElement('div');
                parent.innerHTML = ampImgTag;
                const ampImg = parent.firstChild;
                const imgSrc = `<img src="${ampImg.getAttribute('src')}"></img>`;
                paragraphs.push(`<img src="${ampImg.getAttribute('src')}"></img>`);
                console.log('image tag:', imgSrc);
            }
        }

        // If there was no paragraph or header content, try extracting by the StartFragment tag
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

function startsAHeader(text) {
    return text.includes('<h1') || text.includes('<h2') || text.includes('<h3');
}

function endsAHeader(text) {
    return text.includes('/h1>') || text.includes('/h2>') || text.includes('/h3>');
}

function detectHTML(text) {
    HTMLPattern = new RegExp('<(.*)>.*?|<(.*) />', 'g');
    return HTMLPattern.test(text);
}
