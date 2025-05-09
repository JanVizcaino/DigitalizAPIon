document.addEventListener("DOMContentLoaded",function(){
    toggleModal()
}
);

let searchArray = [];
const songsArray = [];

// Inicia los listeners al cargar el contenido
function initEventListeners() {
    const checkBtn = document.getElementById("check-song");
    if (checkBtn) {
        checkBtn.addEventListener("click", function (event) {
            event.preventDefault();
            if (!validateRegisterForm('check')) return;
            checkSongJSONP();
        });
    }

    const addBtn = document.getElementById("add-song");
    if (addBtn) {
        addBtn.addEventListener("click", function (event) {
            event.preventDefault();
            if (!validateRegisterForm('add')) return;
            addSong();
        });
    }

    const filterBtn = document.getElementById("filter-song");
    if (filterBtn) {
        filterBtn.addEventListener("click", function (event) {
            event.preventDefault();
            if (!validateFilterForm()) return;
            fillFilterDataResult();
        });
    }

    const resetFilter = document.getElementById("reset-filter");
    if (resetFilter) {
        resetFilter.addEventListener("click", function (event) {
            event.preventDefault();
            resetFilterData();
        });
    }

    
}

// Cambia el contenido del body y reinicia los listeners
function toggleBody(element) {
    const modalContainer = document.getElementById("modal-container");
    const url = element.getAttribute("data-url");

    fetch(url)
        .then(response => response.text())
        .then(html => {
            document.getElementById("main").innerHTML = html;
            appendVideo();

            if (url === `html/songslist.html`) {
                const datosGuardados = localStorage.getItem("cancion");
                if (datosGuardados) {
                    const array = JSON.parse(datosGuardados);
                    songsArray.length = 0;
                    array.forEach(song => songsArray.push(song));
                    showSongs();
                }
            }

            appendModal(url);
            initEventListeners();

        })
        .catch(error => console.error("Error:", error));
}

// Obtiene los datos del formulario
function getFormData(type) {
    if (type === 'register') {
        return {
            titulo: document.getElementById('titulo').value.trim(),
            artista: document.getElementById('artista').value.trim(),
            puntuacion: document.querySelector('input[name="puntuacion"]:checked')?.value,
            portada: document.getElementById('portada')?.dataset.remote || null
        };
    } else if (type === 'filter') {
        return {
            titulo: document.getElementById('titulo-filter').value.trim(),
            artista: document.getElementById('artista-filter').value.trim(),
            puntuacion: document.querySelector('input[name="puntuacion-filter"]:checked')?.value
        }
    }
}

// Valida los datos del formulario según el modo (check/add)
function validateRegisterForm(mode) {
    const datosGuardados = localStorage.getItem("cancion");
    const array = JSON.parse(datosGuardados);

    const { titulo, artista, puntuacion, portada } = getFormData('register');
    let error = '';

    if (mode === 'add') {
        if (!titulo) error = "El título es requerido";
        else if (!artista) error = "El artista es requerido";
        else if (!puntuacion) error = "Debes seleccionar una puntuación";
        else if (!portada) error = "No hay imagen remota de portada disponible";

        if (array.some(cancion => cancion.titulo === titulo)) {
            error = "Ya has añadido esta canción";
        }

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
    const { titulo, artista } = getFormData('register');
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
function fillResultData() {
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
                <h5 class="">${song.title}</h5>
                <p class="mb-1"><strong>Artista:</strong> ${song.artist.name}</p>
            </div>
        </div>
        <i class="fa-solid fa-square-plus fs-4 text-secondary"
        onclick="fillFormData('${song.title.replace(/'/g, "\\'")}', '${song.artist.name.replace(/'/g, "\\'")}', '${song.md5_image}')">
        </i>
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
    const { titulo, artista, puntuacion, portada } = getFormData('register');
    const defaultCover = 'img/default-cover.png';

    const nextId = songsArray.length > 0
        ? Math.max(...songsArray.map(s => s.id ?? 0)) + 1
        : 0;

    console.log(nextId);

    const newSong = {
        id: nextId,
        titulo,
        artista,
        puntuacion,
        portada: portada ? `https://e-cdns-images.dzcdn.net/images/cover/${portada}/500x500-000000-80-0-0.jpg` : defaultCover,
        md5_image: portada
    };

    songsArray.push(newSong);
    saveLocalStorage();
    resetForm('register');
    resetResultData();
}

// Reinicia el formulario tras añadir una canción
function resetForm(type) {
    if (type === 'register') {
        document.getElementById("register-form").reset();
        document.getElementById("preview-container").style.visibility = 'hidden';
        document.getElementById("preview-image").src = '';
        document.getElementById("portada").dataset.remote = '';
    } else if (type === 'filter') {
        document.getElementById('filter-form').reset();
    }

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
    <div id="song_${song.id}" class="song-card-list">
        <div class="album-art-list">
            <img src="${song.portada}" alt="${song.titulo}" class="album-cover-list">
        </div>
        <div class="song-info-list">
            <h5>${song.titulo}</h5>
            <p>${song.artista}</p>
        </div>
        <div class="rating-container-list">
            <span id="rating${song.titulo}"></span>
        </div>
    </div>
`).join('');

    songsArray.forEach(song => addRating(song.puntuacion, song.titulo));

    songsArray.forEach(song => addDelete(song.id));
}

// Añade estrellas según la puntuación
function addRating(rating, title) {
    const id = document.getElementById('rating' + title);
    id.innerHTML = '';

    for (let i = 0; i < rating; i++) {
        id.innerHTML += `<i class="fa-solid fa-star"></i>`;
    }
    for (let i = rating; i < 5; i++) {
        id.innerHTML += `<i class="fa-regular fa-star"></i>`;
    }

    id.setAttribute('value', rating)

}


function addDelete(id) {
    const songCard = document.getElementById(`song_${id}`);
    const deleteButton = document.createElement("button");
    deleteButton.classList.add("btn", "btn-danger", "btn-sm", "float-end", "hidden");
    deleteButton.innerHTML = `<i class="fa-solid fa-square-minus"></i>`;
    deleteButton.id = `delete-${id}`;

    songCard.addEventListener("mouseenter", () => {
        deleteButton.classList.remove("hidden");
    });

    songCard.addEventListener("mouseleave", () => {
        deleteButton.classList.add("hidden");
    });


    deleteButton.addEventListener("click", () => {
        const index = songsArray.findIndex(song => song.id === id);
        if (index !== -1) {
            songsArray.splice(index, 1);
            saveLocalStorage();
            showSongs();
            showMessage("success", "Canción eliminada correctamente");
        }
    });

    songCard.appendChild(deleteButton);
}


function saveLocalStorage() {
    localStorage.setItem("cancion", JSON.stringify(songsArray));
}


function validateFilterForm() {
    const { titulo, artista, puntuacion } = getFormData('filter');

    let error = '';

    if (!titulo && !artista && !puntuacion) {
        error = "Debes completar al menos un campo para buscar";
    }

    if (error) {
        showMessage('error', error);
        return false;
    }

    return true;
}

function fillFilterDataResult() {
    const { titulo, artista, puntuacion } = getFormData('filter');

    const datosGuardados = localStorage.getItem("cancion");
    if (!datosGuardados) return;

    const array = JSON.parse(datosGuardados);
    const filteredArray = array.filter(song => {
        const matchesTitulo = !titulo || song.titulo.toLowerCase().includes(titulo.toLowerCase());
        const matchesArtista = !artista || song.artista.toLowerCase().includes(artista.toLowerCase());
        const matchesPuntuacion = !puntuacion || song.puntuacion === puntuacion;

        return matchesTitulo && matchesArtista && matchesPuntuacion;
    });

    if (filteredArray.length === 0) {
        showMessage("error", "No se han encontrado resultados");
    } else {
        showMessage("success", "Se han encontrado resultados");
        songsArray.length = 0;
        filteredArray.forEach(song => songsArray.push(song));
    }

    showSongs();
}

function resetFilterData() {
    resetForm('filter');

    const datosGuardados = localStorage.getItem("cancion");
    if (!datosGuardados) return;

    const array = JSON.parse(datosGuardados);

    songsArray.length = 0;
    array.forEach(song => songsArray.push(song));

    showSongs();
}

function appendVideo() {
    const video = document.createElement("video");
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playbackRate = 0.5;
    video.id = "backgroundVideo";

    const source = document.createElement("source");
    source.src = "img/background.mp4";
    source.type = "video/mp4";

    video.appendChild(source);
    video.innerHTML += "Tu navegador no soporta videos HTML5.";

    document.querySelector("main").appendChild(video);

}

let isModalVisible = false;

function toggleModal() {
    const modalContainer = document.getElementById("modal-container");
    const modalToggler = document.getElementById("toggle-modal");

    isModalVisible = !isModalVisible;

    if (isModalVisible) {
        modalContainer.classList.add('show');
        modalToggler.innerHTML = `<a><i class="fa-solid fa-chevron-right"></i></a>`;
    } else {
        modalContainer.classList.remove('show');
        modalToggler.innerHTML = `<a><i class="fa-solid fa-chevron-down"></i></a>`;
    }
}

function appendModal(url) {
    const modalContainer = document.getElementById("modal-container");
    const modalToggler = document.getElementById("toggle-modal");

    modalContainer.innerHTML = '';

    let modal = document.createElement("div");
    modal.className = "form-container";

    if (url === "html/register.html") {
        modal.innerHTML = `
                    <p class="text-left">Añade tus canciones favoritas a la biblioteca.</p>

                    <form class="form d-flex flex-column gap-2 justify-content-center" id="register-form">
                        <div class="form-group mb-3 d-flex flex-column">
                            <label for="titulo" class="form-label ">Título de la Canción:</label>
                            <input type="text" id="titulo" name="titulo" class="form-control" required>
                        </div>

                        <div class="form-group mb-3 d-flex flex-column">
                            <label for="artista" class="form-label">Artista:</label>
                            <input type="text" id="artista" name="artista" class="form-control" required>
                        </div>


                        <div class="form-group mb-3 d-flex flex-column">
                            <label for="puntuacion" class="form-label ">Puntuación personal:</label>
                            <div class="rating justify-content-end">
                                <input type="radio" id="star5" name="puntuacion" value="5">
                                <label for="star5">★</label>
                                <input type="radio" id="star4" name="puntuacion" value="4">
                                <label for="star4">★</label>
                                <input type="radio" id="star3" name="puntuacion" value="3">
                                <label for="star3">★</label>
                                <input type="radio" id="star2" name="puntuacion" value="2">
                                <label for="star2">★</label>
                                <input type="radio" id="star1" name="puntuacion" value="1">
                                <label for="star1">★</label>
                            </div>
                        </div>

                        <div class="form-group mb-4">

                            <input type="hidden" id="portada" data-remote="">
                            <div id="preview-container" style="display: none;">
                                <img id="preview-image" src="" alt="Previsualización de portada" />
                            </div>

                        </div>

                        <div class="d-flex gap-2">
                            <button type="submit" class="btn btn-secondary w-50" id="check-song">
                                <i class="fa-solid fa-circle-check me-2"></i>Check
                            </button>

                            </button>
                            <button type="submit" class="btn btn-primary w-50" id="add-song">
                                <i class="fas fa-plus-circle me-2"></i>Add
                            </button>
                        </div>

                    </form>`;
    } else if (url === "html/songslist.html") {
        modal.innerHTML = `
                    <p class="text-left">Busca y selecciona en los siguientes filtros.</p>

                    <form class="form d-flex flex-column gap-2 justify-content-center" id="filter-form">
                        <div class="form-group mb-3 d-flex flex-column">
                            <label for="titulo" class="form-label ">Título:</label>
                            <input type="text" id="titulo-filter" name="titulo-filter" class="form-control" required>
                        </div>

                        <div class="form-group mb-3 d-flex flex-column">
                            <label for="artista" class="form-label ">Artista:</label>
                            <input type="text" id="artista-filter" name="artista-filter" class="form-control" required>
                        </div>

                        <div class="form-group mb-3 d-flex flex-column">
                            <label for="puntuacion-filter" class="form-label ">Punt.</label>
                            <div class="rating justify-content-end">
                                <input type="radio" id="star-filter-5" name="puntuacion-filter" value="5">
                                <label for="star-filter-5">★</label>
                                <input type="radio" id="star-filter-4" name="puntuacion-filter" value="4">
                                <label for="star-filter-4">★</label>
                                <input type="radio" id="star-filter-3" name="puntuacion-filter" value="3">
                                <label for="star-filter-3">★</label>
                                <input type="radio" id="star-filter-2" name="puntuacion-filter" value="2">
                                <label for="star-filter-2">★</label>
                                <input type="radio" id="star-filter-1" name="puntuacion-filter" value="1">
                                <label for="star-filter-1">★</label>
                            </div>                         
                        </div>


                        <div class="d-flex gap-2">
                            <button type="submit" class="btn btn-primary w-100" id="filter-song">
                                <i class="fa-solid fa-magnifying-glass me-2"></i>Search
                            </button>
                            <button type="reset" class="btn btn-secondary w-25" id="reset-filter">
                                <i class="fa-solid fa-xmark me-2"></i></button>
                            </button>
                        </div>

                    </form>`;
    } else if (url === "html/index.html") {
                modal.innerHTML = `
                    <p class="text-left mb-0">Pulsa en este botón en las otras páginas para interactuar con ellas.</p>`
    }
    modalContainer.appendChild(modal);

    modalContainer.classList.remove('show');
    isModalVisible = false;
    modalToggler.innerHTML = `<a><i class="fa-solid fa-chevron-down"></i></a>`;

    modalToggler.removeEventListener("click", toggleModal);
    modalToggler.addEventListener("click", toggleModal);
}
