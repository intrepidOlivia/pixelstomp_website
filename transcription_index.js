const contents = [
    {
        title: "Karl Heisenberg ASMR by Jimち",
        link: "transcriptions/heisenberg.html",
        source: "https://youtu.be/ViE2rmi2BFo",
    },
    {
        title: "That's The Metaverse - CNBC News",
        link: "transcriptions/metaverse.html",
        source: "https://twitter.com/haltor/status/1422635896701128708",
    },
];

// fn: insertContents
const contentsContainer = document.querySelector('#transcription_list');
contents.forEach(t => {
    const item = document.createElement('div');
    item.innerHTML = `<div class="transcription_item">
    <div><a href="${t.link}" target="_blank">${t.title}</a></div>
    <div>Source: <span class="src_link"><a href="${t.source}" target="_blank">${t.source}</a></span></div>
</div>`;
    contentsContainer.appendChild(item);
});