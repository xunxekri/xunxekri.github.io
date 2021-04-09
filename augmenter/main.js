const getAll = (data, key) => Promise.all(data.filter(card => card.layout === key).map(card => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = err => reject(err);
  img.classList.add(key);
  img.alt = card.name;
  img.src = card.image_uris.normal;
})));

const createOption = selector => img => { //when in doubt, using currying
  const opt = document.createElement('option');
  opt.innerHTML = img.alt;
  opt.addEventListener('choose', () => {
    let repNode = document.querySelector(selector);
    repNode.parentNode.replaceChild(img, repNode);
  });
  return opt;
};

fetch("https://api.scryfall.com/cards/search?q=is:augment").then(async response => {
  const data = await response.json();
  await Promise.all(['host', 'augment'].map(async key => {
    let images = await getAll(data.data, key);
    let options = images.map(createOption(`img.${key}`));
    let select = document.querySelector(`select.${key}`);
    options.forEach(opt => select.appendChild(opt));
    select.onchange = _ => _.originalTarget.selectedOptions[0].dispatchEvent(new Event('choose'));
    select.firstChild.dispatchEvent(new Event('choose'));
  }));
});