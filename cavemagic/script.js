const baseAPI_URI = "https://api.scryfall.com/cards/named?";
const $ = _ => document.querySelector(_);
const wait = () => new Promise(resolve => setTimeout(resolve, 100));
const getImage = scryfallCardObject => {
  if(scryfallCardObject.card_faces && scryfallCardObject.card_faces[0] && scryfallCardObject.card_faces[0].image_uris) {
    return scryfallCardObject.card_faces[0].image_uris.normal;
    //not willing to bother with dfcs
  } else {
    return scryfallCardObject.image_uris.normal;
  }
}

const finish = cardObjects => {
  $('.export').value = cardObjects.filter(_ => _.inExport).map(_ => _.name).join('\n');
  $('main').classList.add('hide');
  $('.final').classList.remove('hide');
}

const start = async () => {
  const cardList = $('.cardlist').value.split('\n');
  let cardObjects = [];

  $('.total').innerHTML = cardList.length;
  $('.progress').setAttribute('max', cardList.length);
  $('.init').classList.add('hide');
  $('.loading').classList.remove('hide');

  for(let i = 0; i < cardList.length; i++) {
    $('.done').innerHTML = 1+i;
    $('.progress').setAttribute('value', 1+i);
    $('.card-name').innerHTML = cardList[i];

    let card = cardList[i];
    card = card.replace(/^\d+x? /, ''); //no english card starts with a number, so this must be a count
    const set = (card.match(/\(([a-zA-Z0-9]{3})\)/) ?? [])[1];

    let URI = baseAPI_URI;
    URI += `fuzzy=${card}`;
    if(set) URI += `&set=${set}`;
    console.log(URI);

    const scryfallCardObject = await fetch(URI).then(_ => _.json());
    const {name} = scryfallCardObject;
    const imageURI = getImage(scryfallCardObject);
    const scryfallURI = scryfallCardObject.scryfall_uri;
    let inExport = false;

    cardObjects.push({name, imageURI, scryfallURI, inExport});
    await wait();
  }
  console.table(cardObjects);

  let currentIndex = 0;
  const showImage = () => {
    $('.img').setAttribute('src', cardObjects[currentIndex].imageURI);
    $('.scrylink').setAttribute('href', cardObjects[currentIndex].scryfallURI);
  };

  const prev = () => {
    if(currentIndex == 0) return;
    currentIndex--;
    showImage;
  };

  const next = () => {
    if(++currentIndex >= cardObjects.length) {
      finish(cardObjects);
      return;
    }
    showImage();
  };

  const yea = () => {
    cardObjects[currentIndex].inExport = true;
    next();
  };

  const nay = () => {
    cardObjects[currentIndex].inExport = false;
    next();
  }

  $('.prev').onclick = prev;
  $('.yea').onclick = yea;
  $('.nay').onclick = nay;

  showImage();
  $('.loading').classList.add('hide');
  $('main').classList.remove('hide');
}

$('.start').onclick = start;