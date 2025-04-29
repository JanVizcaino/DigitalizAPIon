const songsArray = [];

document.addEventListener("DOMContentLoaded", function () { //Cuando el documento carga
    document.getElementById("check-song").addEventListener("click", async function (event) { //Añade un eventListener al boton de comprobar cancion
        event.preventDefault();
        if (!validateForm('check')) return; //Si el formulario está mal, vuelve.
        await checkSong(); //Si está bien, comprueba la cancion en la API
    });

    document.getElementById("add-song").addEventListener("click", function (event) { //Añade un eventListener al boton de añadir cancion
        event.preventDefault();
        if (!validateForm('add')) return; //Si el formulario esta mal, vuelve.
        addSong(); // Si está bien, añade la cancion.
    });

    document.getElementById('portada').addEventListener('change', previewImage); //Añade un eventListener de cambio a la portada, para que aparezca la preview image. 
});

function getFormData() { //Consigue los datos del formulario.
    const file = document.getElementById('portada').files[0] || null; //Crea la constante file, con el primer archivo que se añade, también puede ser null.
    const remoteMd5 = document.getElementById('portada').dataset.remote || null; //Crea la constante remoteMd5, con el archivo remoto de Md5, también puede ser null.

    return { //Devuelve el valor de todo el formulario.
        titulo: document.getElementById('titulo').value.trim(),
        artista: document.getElementById('artista').value.trim(),
        genero: document.getElementById('genero').value.trim(),
        portada: file || remoteMd5
    };
}

function validateForm(mode) { //Validación del formulario.
    const { titulo, artista, genero, portada } = getFormData(); //Consigue los datos del formulario.
    let error = ''; //Crea la variable error.

    if (mode === 'add') { //Si el modo es 'add'
        if (!titulo) error = "El título es requerido";
        else if (!artista) error = "El artista es requerido";
        else if (!genero) error = "Debes seleccionar un género";
        else if (!portada) error = "Debes subir una imagen de portada";
        else {
            if (portada.size > 5 * 1024 * 1024) error = "La imagen es demasiado grande (Máx 5MB)";
        } //Si falta algun campo, devuelve error.
    } else if (mode === 'check') { //Si el modo es 'check
        if (!titulo && !artista) {  
            error = "Debes completar al menos un campo para buscar";
        } //Si faltan los dos campos, devuelve error
    }


    if (error) { //Si error tiene contenido, manda mensaje de error.
        showMessage('error', error);
        return false;
    }

    if (mode === 'add') { //Si está en modo añadir, muestra el mensaje.
        showMessage('success', `🎵 "${titulo}" de ${artista} añadida correctamente!`);
    }

    return true;
}


function showMessage(type, text) { //Funcion para gestionar los mensajes.
    const msg = document.getElementById("msg");
    const alertIcon = document.getElementById("alert-icon");
    const alertMsg = document.getElementById("alert-msg"); 
    //Crea las variables de los elementos de la alerta.

    alertIcon.className = type === 'success' ? "fas fa-check-circle text-success" : "fas fa-exclamation-circle text-danger"; //Le añadimos clases dependiendo del tipo de mensaje.
    alertMsg.textContent = text; //Inserimos en el mensaje el texto pasado a la variable.
    msg.className = `alert alert-${type === 'success' ? 'success' : 'danger'} position-fixed top-0 end-0 mt-3 me-3 text-start shadow`; //Le añadimos las clases generales.
    msg.classList.remove("d-none"); //Eliminamos el display none para que aparezca.

    setTimeout(() => msg.classList.add("d-none"), 3000); //Hacemos que desaparezca cuando pasen 3 segundos.
}

function previewImage() {
    const fileInput = document.getElementById('portada');
    const previewContainer = document.getElementById('preview-container');
    const previewImage = document.getElementById('preview-image');

    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            previewImage.src = e.target.result;
            previewContainer.style.display = 'block';
        }
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        previewContainer.style.display = 'none';
    }
}

function addSong() {
    const { titulo, artista, genero, portada } = getFormData();
    const defaultCover = 'img/default-cover.png';

    const newSong = {
        titulo,
        artista,
        genero,
        portada: defaultCover,
        md5_image: null
    };

    if (portada instanceof File) {
        const reader = new FileReader();
        reader.onloadend = function () {
            const arrayBuffer = reader.result;
            const spark = new SparkMD5.ArrayBuffer();
            spark.append(arrayBuffer);
            const hash = spark.end();

            const base64Reader = new FileReader();
            base64Reader.onloadend = function () {
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



function resetForm() { //Borrar los datos del formulario. 
    document.getElementById("formulario").reset();
    document.getElementById("preview-container").style.display = 'none';
}

function showSongs() {
    const songsList = document.getElementById("songs-list");
    const emptyMsg = document.getElementById("empty-msg");

    songsList.style.display = songsArray.length > 0 ? "grid" : "none";
    emptyMsg.style.display = songsArray.length === 0 ? "flex" : "none";

    songsList.innerHTML = songsArray.map(song => `
        <div class="song-card bg-light p-3 mb-3 rounded">
            <div class="album-art">
                <img src="${song.portada}" alt="${song.titulo}" class="album-cover">
            </div>
            <div class="song-info mt-2">
                <h5 class="text-primary">${song.titulo}</h5>
                <p class="mb-1"><strong>Artista:</strong> ${song.artista}</p>
                <p class="mb-0"><strong>Género:</strong> ${song.genero}</p>
            </div>
        </div>
    `).join('');
}

async function checkSong() {
    const { titulo, artista } = getFormData();

    const valor = titulo ? titulo : artista;

    try {
        const options = {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': '017087c24cmshdca70a5d1e0cffbp192283jsnfa8842e27915',
                'X-RapidAPI-Host': 'deezerdevs-deezer.p.rapidapi.com'
            }
        };

        const response = await fetch(`https://deezerdevs-deezer.p.rapidapi.com/search?q=${encodeURIComponent(valor)}`, options);
        const data = await response.json();
        const firstData = data.data[0];

        if (data.data && data.data.length > 0) {
            showMessage('success', `🎵 "${valor}" encontrada!`);

            const titulo = firstData.title;
            const artista = firstData.artist.name;
            const portada = firstData.md5_image;

            fillFormData(titulo, artista, portada);
        } else {
            showMessage('error', 'No se encontro la canción.');
        }
    } catch (error) {
        showMessage('error', 'Error al buscar la canción.');
    }
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
