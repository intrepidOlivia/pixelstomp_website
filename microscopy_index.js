const gallery = [
  {
    src: './images/microscopy/cup_fungus.JPG',
    description: `Unknown <a href="javascript:showViewer('./images/cup_fungus.JPG');">cup fungus</a>, Nov 2018`,
  },
  {
    src: './images/microscopy/marasmius_oreades.JPG',
    description: `Gills of <a href="javascript:showViewer('./images/marasmius.JPG');"><i>Marasmius oreades</i></a>, Nov 2018`
  },
  {
    src: './images/microscopy/marasmius_grubs.JPG',
    description: 'Residents of <i>Marasmius oreades</i>, Nov 2018',
  },
  {
    src: './images/microscopy/ganoderma.JPG',
    description: `Pores from <a href="javascript:showViewer('./images/varnished_conk_ventral.JPG');">underside</a> of <a href="javascript:showViewer('./images/varnished_conk_dorsal.JPG');">Varnished Conk</a> (<i>Ganoderma spp.</i>), Nov 2018`,
  },
  {
    src: './images/microscopy/zellers_bolete.JPG',
    description: "Pores of Zeller's Bolete (<i>Xerocomellus zelleri</i>), Nov 2018",
  },
  {
    src: './images/microscopy/shelf_polypore.JPG',
    description: `Pores from <a href="javascript:showViewer('./images/shelf_polypore.JPG');">underside</a> of unknown <a href="javascript:showViewer('./images/shelf_polypore_dorsal.JPG');">shelf polypore</a>, Nov 2018`,
  },
  {
    src: './images/microscopy/helvella_stem.JPG',
    description: `Fluted stem of <a href="javascript:showViewer('./images/helvella_vespertina.JPG');"><i>Helvella vespertina</i></a>, Nov 2018`
  },
];

insertPanels(gallery);

const viewer = document.getElementById('imgViewer');
const fullImgWrapper = document.getElementById('fullImgWrapper');

function createPanels(content) {
  return content.map((item, idx) => {
    return `<div key="panel_${item.src}" class="panelWrapper">
<div class="imgWrapper">
<img src="${item.src}" class="thumbnail" height="300px" onclick="showViewer('${item.src}')" />
</div>
<div class="description">
<p>${item.description}</p>
</div>
    </div>`;
  });
}

function closeViewer() {
  const img = document.getElementById('fullImg');
  img && img.remove();
  viewer.style.visibility = 'hidden';
}

function insertPanels(content) {
  const frame = document.getElementById("galleryIndex");
  frame.innerHTML = createPanels(content).join('');
}

function showViewer(src) {
  const img = document.createElement('img');
  img.id = 'fullImg';
  img.src = src;
  img.style.maxHeight = '100%';
  img.style.maxWidth = '100%';
  fullImgWrapper.appendChild(img);
  viewer.style.visibility = 'visible';
}
