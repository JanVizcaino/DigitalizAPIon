const songsArray = [];

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("check-song").addEventListener("click", function (event) {
        event.preventDefault();
        if (!validateForm('check')) return;
        checkSongJSONP();
    });

    document.getElementById("add-song").addEventListener("click", function (event) {
        event.preventDefault();
        if (!validateForm('add')) return;
        addSong();
    });

    document.getElementById('portada').addEventListener('change', previewImage);
});

function getFormData() {
    const file = document.getElementById('portada').files[0] || null;
    const remoteMd5 = document.getElementById('portada').dataset.remote || null;

    return {
        titulo: document.getElementById('titulo').value.trim(),
        artista: document.getElementById('artista').value.trim(),
        puntuacion: document.querySelector('input[name="puntuacion"]:checked')?.value,
        portada: file || remoteMd5
    };
}

function validateForm(mode) {
    const { titulo, artista, puntuacion, portada } = getFormData();
    let error = '';

    if (mode === 'add') {
        if (!titulo) error = "El título es requerido";
        else if (!artista) error = "El artista es requerido";
        else if (!puntuacion) error = "Debes seleccionar una puntuación";
        else if (!portada) error = "Debes subir una imagen de portada";
        else if (portada instanceof File && portada.size > 5 * 1024 * 1024)
            error = "La imagen es demasiado grande (Máx 5MB)";
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

function previewImage() {
    const fileInput = document.getElementById('portada');
    const previewContainer = document.getElementById('preview-container');
    const previewImage = document.getElementById('preview-image');

    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            previewImage.src = e.target.result;
            previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        previewContainer.style.display = 'none';
    }
}

function addSong() {
    const { titulo, artista, puntuacion, portada } = getFormData();
    const defaultCover = 'img/default-cover.png';
    const newSong = { titulo, artista, puntuacion, portada: defaultCover, md5_image: null };

    if (portada instanceof File) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const arrayBuffer = reader.result;
            const spark = new SparkMD5.ArrayBuffer();
            spark.append(arrayBuffer);
            const hash = spark.end();

            const base64Reader = new FileReader();
            base64Reader.onloadend = () => {
                newSong.portada = base64Reader.result;
                newSong.md5_image = hash;
                songsArray.push(newSong);
                showSongs();
                resetForm();
            };
            base64Reader.readAsDataURL(portada);
        };
        reader.readAsArrayBuffer(portada);
    } else if (typeof portada === 'string') {
        newSong.portada = `https://e-cdns-images.dzcdn.net/images/cover/${portada}/500x500-000000-80-0-0.jpg`;
        newSong.md5_image = portada;
        songsArray.push(newSong);
        showSongs();
        resetForm();
    } else {
        songsArray.push(newSong);
        showSongs();
        resetForm();
    }
}

function resetForm() {
    document.getElementById("formulario").reset();
    document.getElementById("preview-container").style.display = 'none';
}

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

function addRating(rating, title) {
    const id = document.getElementById('rating' + title);
    for (let i = 0; i < rating; i++) id.appendChild(document.createTextNode("★"));
    for (let i = rating; i < 5; i++) id.appendChild(document.createTextNode("☆"));
}

// JSONP callback para Deezer
function deezerCallback(response) {
    if (response && response.data && response.data.length) {
        const first = response.data[0];
        fillFormData(first.title, first.artist.name, first.md5_image);
        showMessage('success', `🎵 "${first.title}" encontrada! 😹😉`);
    } else {
        showMessage('error', '😹😉 No se encontró ningún resultado.');
    }
}

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

function fillFormData(titulo, artista, portada) {
    document.getElementById('titulo').value = titulo;
    document.getElementById('artista').value = artista;
    if (typeof portada === 'string') {
        document.getElementById('preview-image').src = `https://e-cdns-images.dzcdn.net/images/cover/${portada}/500x500-000000-80-0-0.jpg`;
        document.getElementById('preview-container').style.display = 'block';
        document.getElementById('portada').dataset.remote = portada;
    }
}
