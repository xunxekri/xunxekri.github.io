
const safeFetchMaker = () => {
	const fetchQueue = [];
	setInterval(() => { if(fetchQueue.length > 0) fetchQueue.shift()(); }, 150);
	return (...args) =>	new Promise(resolve => fetchQueue.push(resolve)).then(() => fetch(...args));
};

(async() => {

const safeFetch = safeFetchMaker();
const setlistRequest = await safeFetch('https://api.scryfall.com/sets');
const setlistData = await setlistRequest.json();
const exlcudeCriteria = /token|promo|alchemy/;
const $datalist = document.querySelector('#sets');
const $input = document.querySelector('#chosen-set');
const $download = document.querySelector('#download');
const $images = document.querySelector('#images');
const $imageType = document.querySelector('#image-type');
const $progress = document.querySelector('#progress');

const sets = setlistData.data.filter(sset => !exlcudeCriteria.test(sset.set_type));

let setNameToSet = new Map();
//let setCodeToName = new Map();
sets.forEach(sset => {
	if(setNameToSet.has(sset.name)) throw `Set name ${sset.name} declared twice`;
	setNameToSet.set(sset.name, sset);
	setNameToSet.set(sset.code, sset);

	const $el = document.createElement('option');
	$el.value = sset.name;
	$datalist.appendChild($el);
});

const getImagesAndNames = type => card => {
	if(card.card_faces && card.card_faces[0].image_uris) {
		return card.card_faces.map((face, i) => {return {image: face.image_uris[type], name: face.name}});
	}

	return [{image: card.image_uris[type], name: card.name}];
}

$input.addEventListener('input', async() => {
	$progress.style.opacity = 0;
	$images.innerHTML = '';
	const setName = $input.value;
	if(!setNameToSet.has(setName)) return;

	let has_more = true;
	let setReqs = [];
	let next_page = `https://api.scryfall.com/cards/search?q=in:paper%20s:${setNameToSet.get(setName).code}`;
	while(has_more) {
		let newData = await safeFetch(next_page).then(data => data.json());
		has_more = newData.has_more;
		next_page = newData.next_page;
		setReqs.push(newData);
	}
	setReqs.flatMap(req => req.data).flatMap(getImagesAndNames($imageType.value)).forEach(card => {
		let $img = document.createElement('img');
		$img.src = card.image;
		$img.alt = card.name;
		$images.appendChild($img);
	});
});

$input.dispatchEvent(new Event('input'));

$imageType.addEventListener('input', () => $input.dispatchEvent(new Event('input')));

$download.addEventListener('click', async() => {
	if(!$images.firstChild) return;
	let progress = 0;
	$progress.value = 0;
	$progress.max = $images.children.length * 2;
	$progress.style.opacity = 1;
	const zip = new JSZip();
	const images = await Promise.all([...$images.children].map(async($img) => {
		const imageBlob = await (await fetch($img.src).then(res => res.blob()));
		$progress.value = ++progress;
		return [$img.alt, imageBlob];
	}));
	images.forEach(([name, image]) => {
		zip.file(`${name}.png`, image);
		$progress.value = ++progress;
	});
	const zipFile = await zip.generateAsync({type: 'blob'});
	const a = document.createElement('a');
	const url = URL.createObjectURL(zipFile);
	a.href = url;
	a.download = $input.value;
	a.style.display = 'none';
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
});


})();
