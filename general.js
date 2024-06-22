/* –––––––––––––––––––––––––––––––– GENRE SELECTION BOXES ––––––––––––––––––––––––––––––––– */

let selectedGenres = [];

function genreOnClick() {
    const genres = document.getElementsByClassName("check");
    for (let genre of genres) {
        genre.addEventListener("click", toggleGenreSelection);
    }
}

function toggleGenreSelection() {
    const genreId = this.id;
    const isSelected = selectedGenres.includes(genreId);
    this.style.width = isSelected ? "340px" : "320px";
    this.style.height = isSelected ? "340px" : "320px";
    if (isSelected) {
        selectedGenres = selectedGenres.filter(id => id !== genreId);
    } else {
        selectedGenres.push(genreId);
    }
}

function nextPage() {
    if (selectedGenres.length === 0) {
        alert("Error! Please pick a genre!");
        return;
    }
    let queryString = selectedGenres.map((genre, index) => `para${index + 1}=${genre}`).join("&");
    window.location.href = `tablePage.html?${queryString}`;
}

/* ––––––––––––––––––––––––––––––––– SEARCH BAR –––––––––––––––––––––––––––––––––– */

document.addEventListener('DOMContentLoaded', function() {
    const options = { limit: Infinity };
    const elems = document.querySelectorAll('.chips');
    M.Chips.init(elems, options);
});

/* –––––––––––––––––––––––––– PARAMETERS FROM LANDING PAGE –––––––––––––––––––––––– */

function landingPageParameters() {
    const queryString = decodeURIComponent(window.location.search.substring(1));
    const queries = queryString.split("&");
    for (let query of queries) {
        selectedGenres.push(query.split("=")[1]);
    }
    updateGenreSelection();
    populateYearOptions();
    M.Tooltip.init(document.querySelectorAll('.tooltipped'), {});
    submit();
}

function updateGenreSelection() {
    const genreSelect = document.getElementById('genres');
    selectedGenres.forEach(genre => {
        for (let option of genreSelect.options) {
            if (option.value === genre) {
                option.selected = true;
            }
        }
    });
}

/* ––––––––––––––––––––––––– YEAR SELECT –––––––––––––––––––––––––––––– */

function populateYearOptions() {
    const year1Select = document.getElementById('year1');
    const year2Select = document.getElementById('year2');
    for (let year = 2024; year > 1898; year--) {
        const option1 = new Option(year, year);
        const option2 = new Option(year, year);
        year1Select.add(option1);
        year2Select.add(option2);
    }
    M.FormSelect.init(document.querySelectorAll('select'), {});
}

/* ——————————————————————————— SUBMIT BUTTON ———————————————————————————— */

const access_token = ""; // Fill with token

function submit() {
    const genreSelect = document.getElementById('genres');
    const selectedGenres = Array.from(genreSelect.options).filter(option => option.selected).map(option => option.value);
    const chips = document.getElementsByClassName("chip");
    const selectedArtists = Array.from(chips).map(chip => chip.textContent.slice(0, -5));
    const year1 = document.getElementById("year1").value;
    const year2 = document.getElementById("year2").value;
    const yearRange = `${year1}-${year2}`;
    if (!selectedGenres.length && !selectedArtists.length && yearRange === '-') {
        alert("Please Select Parameters!");
        return;
    }
    searchTracks({ genres: selectedGenres, artists: selectedArtists, yearRange});
}

async function searchTracks({ genres, artists, yearRange }) {
    const songList = [];
    for (let genre of genres.length ? genres : [""]) {
        for (let artist of artists.length ? artists : [""]) {
            const parameters = { genre, artist, year: yearRange };
            const tracks = await fetchTracks(parameters);
            songList.push(...tracks);
        }
    }
    displayTracks(songList);
}

async function fetchTracks(parameters) {
    const baseUrl = "https://api.spotify.com/v1/search";
    const query = new URLSearchParams({
        q: `${parameters.artist ? `artist:${parameters.artist}` : ''} ${parameters.year ? `year:${parameters.year}` : ''} ${parameters.genre ? `genre:${parameters.genre}` : ''}`,
        type: 'track',
        limit: 50
    });
    const response = await fetch(`${baseUrl}?${query}`, { headers: { "Authorization": `Bearer ${access_token}` } });
    const data = await response.json();
    return data.tracks.items;
}

function displayTracks(tracks) {
    if (!tracks.length) {
        alert("No tracks found!");
        return;
    }
    removeExistingTable();
    createTableStructure();
    populateTable(tracks);
}

function removeExistingTable() {
    const oldTable = document.getElementById('results');
    if (oldTable) {
        oldTable.parentNode.removeChild(oldTable);
    }
}

function createTableStructure() {
    const body = document.querySelector('body');
    const table = document.createElement('table');
    table.id = "results";
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    ["", "NAME", "ARTIST", "ALBUM", "POPULARITY", "DURATION"].forEach(text => {
        const th = document.createElement("th");
        th.textContent = text;
        headerRow.appendChild(th);
    });
    body.appendChild(table);
}

function populateTable(tracks) {
    const table = document.getElementById('results');
    tracks.sort((a, b) => b.popularity - a.popularity).slice(0, 50).forEach(track => {
        const row = table.insertRow();
        row.innerHTML = `
            <td><a href="${track.uri}" class="valign-wrapper"><i class="material-icons" style="font-size: 2.2rem">play_circle_outline</i></a></td>
            <td>${track.name}</td>
            <td>${track.artists.map(artist => artist.name).join(", ")}</td>
            <td>${track.album.name}</td>
            <td style="text-align: center">${track.popularity}</td>
            <td style="text-align: center">${Math.floor(track.duration_ms / 60000)}:${(track.duration_ms % 60000 / 1000).toFixed(0).padStart(2, '0')}</td>
        `;
    });
}
