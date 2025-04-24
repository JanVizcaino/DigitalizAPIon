const songsArray = []; //Creamos el array de canciones que se va a rellenar

document.addEventListener("DOMContentLoaded", function () { 
    document.getElementById("add-song").addEventListener("click", function (event) { //Cuando se pulse en añadir cancion
        if (!validateForm(event)) return; //Si el formulario no es válido, return;
        handleImageUpload(event); //Se gestiona la imagen
    });

    document.getElementById('portada').addEventListener('change', function(e) { //Cuando se pulse en añadir portada
        const previewContainer = document.getElementById('preview-container'); 
        const previewImage = document.getElementById('preview-image');
        
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                previewImage.src = e.target.result;
                previewContainer.style.display = 'block';
            }
            
            reader.readAsDataURL(this.files[0]);
        } else {
            previewContainer.style.display = 'none';
        }
    });
});

function validateForm(event) { //Función para validar un formulario
    event.preventDefault(); //Prevenimos que no se reinicie la pagina

    const msg = document.getElementById("msg");
    const alertIcon = document.getElementById("alert-icon");
    const alertMsg = document.getElementById("alert-msg");

    const titulo = document.getElementById('titulo').value.trim();
    const artista = document.getElementById('artista').value.trim();
    const genero = document.getElementById('genero').value.trim();
    const portada = document.getElementById('portada').files[0];

    let error = ''; 
    //Creamos la variable error vacía. 
    
    if (!titulo) error = "El título es requerido";
    else if (!artista) error = "El artista es requerido";
    else if (!genero) error = "Debes seleccionar un género"; 
    
    if (portada) {
        if (portada.size > 5 * 1024 * 1024) error = "La imagen es demasiado grande (Máx 5MB)";
        else if (!['image/jpeg', 'image/png', 'image/jpg'].includes(portada.type)) {
            error = "Formato de imagen no válido";
        }
    }
    //Si falta o falla algo, añadimos el mensaje de error.

    if (error) {
        alertIcon.className = "fas fa-exclamation-circle text-danger";
        alertMsg.textContent = error;
        msg.className = "alert alert-danger position-fixed top-0 end-0 mt-3 me-3 text-start shadow";
        msg.classList.remove("d-none");
        setTimeout(() => msg.classList.add("d-none"), 3000);
        return false;
    } //Si se ha añadido el mensaje de error, se muestra la notificacion
    
    alertIcon.className = "fas fa-check-circle text-success";
    alertMsg.textContent = `🎵 "${titulo}" de ${artista} añadida correctamente!`;
    msg.className = "alert alert-success position-fixed top-0 end-0 mt-3 me-3 text-start shadow";
    msg.classList.remove("d-none");
    setTimeout(() => msg.classList.add("d-none"), 3000);
    return true;

    //Si no se ha añadido el mensaje de error, se sigue.
}

function handleImageUpload(event) { //Función para gestionar el ingreso de imagen.
    event.preventDefault();
    
    const file = document.getElementById('portada').files[0];
    const defaultCover = 'img/default-cover.png';

    const newSong = {
        titulo: document.getElementById('titulo').value.trim(),
        artista: document.getElementById('artista').value.trim(),
        genero: document.getElementById('genero').value.trim(),
        portada: defaultCover // Valor por defecto
    };

    if (file) {
        const reader = new FileReader();
        reader.onloadend = function() {
            newSong.portada = reader.result;
            songsArray.push(newSong);
            showSongs();
            resetForm();
        }
        reader.readAsDataURL(file);
    } else {
        songsArray.push(newSong);
        showSongs();
        resetForm();
    }
}

function resetForm() { //Funcion para borrar el formulario.
    document.getElementById("formulario").reset();
    document.getElementById("preview-container").style.display = 'none';
}

function showSongs() { //Funcion para mostrar las canciones.
    const songsList = document.getElementById("songs-list");
    const emptyMsg = document.getElementById("empty-msg");
    
    songsList.style.display = songsArray.length > 0 ? "grid" : "none";
    emptyMsg.style.display = songsArray.length === 0 ? "flex" : "none";

    songsList.innerHTML = ""; 

    songsArray.forEach(song => {
        const card = document.createElement("div");
        card.className = "song-card bg-light p-3 mb-3 rounded";
        card.innerHTML = `
            <div class="album-art">
                <img src="${song.portada}" alt="${song.titulo}" class="album-cover">
            </div>
            <div class="song-info mt-2">
                <h5 class="text-primary">${song.titulo}</h5>
                <p class="mb-1"><strong>Artista:</strong> ${song.artista}</p>
                <p class="mb-0"><strong>Género:</strong> ${song.genero}</p>
            </div>
        `;
        songsList.appendChild(card);
    });
}