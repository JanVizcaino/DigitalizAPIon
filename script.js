let searchArray = [];
const songsArray = [];

// Inicia los listeners al cargar el contenido
function initEventListeners() {
    const checkBtn = document.getElementById("check-song");
    if (checkBtn) {
        checkBtn.addEventListener("click", function (event) {
            event.preventDefault();
            if (!validateForm('check')) return;
            checkSongJSONP();
        });
    }

    const addBtn = document.getElementById("add-song");
    if (addBtn) {
        addBtn.addEventListener("click", function (event) {
            event.preventDefault();
            if (!validateForm('add')) return;
            addSong();
        });
    }
}

// Cambia el contenido del body y reinicia los listeners
function toggleBody(element) {
    const url = element.getAttribute("data-url");

    fetch(url)
        .then(response => response.text())
        .then(html => {
            const contenido = html;
            document.getElementById("main").innerHTML = contenido;
            initEventListeners();
        })
        .catch(error => console.error("Error al cargar el contenido:", error));
}

// Obtiene los datos del formulario
function getFormData() {
    return {
        titulo: document.getElementById('titulo').value.trim(),
        artista: document.getElementById('artista').value.trim(),
        puntuacion: document.querySelector('input[name="puntuacion"]:checked')?.value,
        portada: document.getElementById('portada')?.dataset.remote || null
    };
}

// Valida los datos del formulario según el modo (check/add)
function validateForm(mode) {
    const { titulo, artista, puntuacion, portada } = getFormData();
    let error = '';

    if (mode === 'add') {
        if (!titulo) error = "El título es requerido";
        else if (!artista) error = "El artista es requerido";
        else if (!puntuacion) error = "Debes seleccionar una puntuación";
        else if (!portada) error = "No hay imagen remota de portada disponible";
    } else if (mode === 'check') {
        if (!titulo && !artista) error = "Debes completar al menos un campo para buscar";
    }

    if (error) {
        showMessage('error', error);
        return false;
    }

    if (mode === 'add') {
        showMessage('success', `🎵 "${titulo}" de ${artista} añadida correctamente!`);
    }
    return true;
}

// Muestra un mensaje en pantalla (éxito o error)
function showMessage(type, text) {
    const msg = document.getElementById("msg");
    const alertIcon = document.getElementById("alert-icon");
    const alertMsg = document.getElementById("alert-msg");

    alertIcon.className = type === 'success'
        ? "fas fa-check-circle text-success"
        : "fas fa-exclamation-circle text-danger";
    alertMsg.textContent = text;
    msg.className = `alert alert-${type === 'success' ? 'success' : 'danger'} position-fixed top-0 end-0 mt-3 me-3 text-start shadow`;
    msg.classList.remove("d-none");

    setTimeout(() => msg.classList.add("d-none"), 3000);
}

// Llama a la API de Deezer usando JSONP
function checkSongJSONP() {
    const { titulo, artista } = getFormData();
    const parts = [];
    if (titulo) parts.push(`track:"${titulo}"`);
    if (artista) parts.push(`artist:"${artista}"`);
    const query = encodeURIComponent(parts.join(' '));

    const script = document.createElement('script');
    script.src = `https://api.deezer.com/search?q=${query}&output=jsonp&callback=deezerCallback`;
    script.onerror = () => showMessage('error', '😹😉 Error al cargar datos de Deezer.');
    script.onload = () => document.body.removeChild(script);
    document.body.appendChild(script);
}

// Callback que recibe datos desde Deezer
function deezerCallback(response) {
    if (response && response.data && response.data.length) {
        searchArray = response.data.slice(0, 10);
        fillResultData();
    } else {
        showMessage('error', 'No se encontró ningún resultado.');
    }
}

// Llena la lista de resultados con las canciones encontradas
function fillResultData(){
    const resultList = document.getElementById("results-list");
    const emptyMsg = document.getElementById("empty-msg");
    resultList.style.display = searchArray.length ? "flex" : "none";
    emptyMsg.style.display = searchArray.length ? "none" : "flex";

    resultList.innerHTML = searchArray.map((song, index) => `
    <li class="d-flex justify-content-between align-items-center search-result">
        <div class="d-flex align-items-center">
            <p class="mb-0 me-5">#${index + 1}</p>
            <div class="search-album-art">
                <img src="https://e-cdns-images.dzcdn.net/images/cover/${song.md5_image}/500x500-000000-80-0-0.jpg" alt="${song.title}" class="album-cover">
            </div>
            <div class="search-song-info ms-3 mt-2">
                <h5 class="text-primary">${song.title}</h5>
                <p class="mb-1"><strong>Artista:</strong> ${song.artist.name}</p>
            </div>
        </div>
        <i class="fa-solid fa-square-plus fs-4 text-secondary" onclick='fillFormData(${JSON.stringify(song.title)}, ${JSON.stringify(song.artist.name)}, ${JSON.stringify(song.md5_image)})'></i>
    </li>
    `).join('');
}

// Rellena el formulario con los datos de una canción seleccionada
function fillFormData(titulo, artista, portada) {
    document.getElementById('titulo').value = titulo;
    document.getElementById('artista').value = artista;
    if (typeof portada === 'string') {
        const imgURL = `https://e-cdns-images.dzcdn.net/images/cover/${portada}/500x500-000000-80-0-0.jpg`;
        document.getElementById('preview-image').src = imgURL;
        document.getElementById('preview-container').style.display = 'flex';
        document.getElementById('portada').dataset.remote = portada;
    }
}

// Añade una canción al array de canciones
function addSong() {
    const { titulo, artista, puntuacion, portada } = getFormData();
    const defaultCover = 'img/default-cover.png';

    const newSong = {
        titulo,
        artista,
        puntuacion,
        portada: portada ? `https://e-cdns-images.dzcdn.net/images/cover/${portada}/500x500-000000-80-0-0.jpg` : defaultCover,
        md5_image: portada
    };

    songsArray.push(newSong);
    resetForm();
    resetResultData();
}

// Reinicia el formulario tras añadir una canción
function resetForm() {
    document.getElementById("formulario").reset();
    document.getElementById("preview-container").style.visibility = 'hidden';
    document.getElementById("preview-image").src = '';
    document.getElementById("portada").dataset.remote = '';
}

function resetResultData() {
    const resultList = document.getElementById("results-list");
    const emptyMsg = document.getElementById("empty-msg");
    resultList.style.display = "none";
    emptyMsg.style.display = "flex";
}

// Muestra la lista de canciones añadidas
function showSongs() {
    const songsList = document.getElementById("songs-list");
    const emptyMsg = document.getElementById("empty-msg");
    songsList.style.display = songsArray.length ? "grid" : "none";
    emptyMsg.style.display = songsArray.length ? "none" : "flex";

    songsList.innerHTML = songsArray.map(song => `
        <div class="song-card bg-light p-3 mb-3 rounded">
            <div class="album-art"><img src="${song.portada}" alt="${song.titulo}" class="album-cover"></div>
            <div class="song-info mt-2"><h5 class="text-primary">${song.titulo}</h5>
                <p class="mb-1"><strong>Artista:</strong> ${song.artista}</p>
                <p class="mb-0"><strong>Puntuación:</strong><span id="rating${song.titulo}"></span></p>
            </div>
        </div>
    `).join('');

    songsArray.forEach(song => addRating(song.puntuacion, song.titulo));
}

// Añade estrellas según la puntuación
function addRating(rating, title) {
    const id = document.getElementById('rating' + title);
    for (let i = 0; i < rating; i++) id.appendChild(document.createTextNode("★"));
    for (let i = rating; i < 5; i++) id.appendChild(document.createTextNode("☆"));
}
