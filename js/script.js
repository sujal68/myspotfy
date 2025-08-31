let currentSong = new Audio();
let play = document.getElementById("play");
let currentTrack = null;
let songs;
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getsongs(folder, updateCurrentFolder = true) {
    if (updateCurrentFolder) {
        currFolder = folder;
    }
    let a = await fetch(`http://127.0.0.1:5500/${folder}/`)
    let response = await a.text()

    let div = document.createElement("div")
    div.innerHTML = response;

    let links = div.getElementsByTagName("a")

    let songHrefs = [];
    for (let i = 0; i < links.length; i++) {
        let href = links[i].getAttribute("href")
        if (href.endsWith(".mp3")) {
            songHrefs.push(href.split(`/${folder}/`)[1])
        }
    }

    return songHrefs
}

// New function to update sidebar with songs
function updateSidebar(songs) {
    let songul = document.querySelector(".song-list").getElementsByTagName("ul")[0];

    // Clear existing songs
    songul.innerHTML = "";

    // Add new songs
    for (const song of songs) {
        songul.innerHTML = songul.innerHTML + `<li class="flex align-item-center justify-content-between">
             <div class="start flex align-item-center">
                <i class="ri-music-2-line"></i>
                <div class="info">
                    <div class="song-name">${song.replaceAll("%20", " ")}</div>
                    <div class="song-artist"><p>Sujal Kidecha</p></div>
                </div>
             </div>
             <i class="ri-play-fill fs-2_5"></i>
            </li>`;
    }

    // Re-attach event listeners to new song items
    attachSongListeners();
}

// Function to update sidebar without affecting global songs array and currFolder
function updateSidebarOnly(newSongs, folderName) {
    let songul = document.querySelector(".song-list").getElementsByTagName("ul")[0];

    // Clear existing songs
    songul.innerHTML = "";

    // Add new songs
    for (const song of newSongs) {
        songul.innerHTML = songul.innerHTML + `<li class="flex align-item-center justify-content-between" data-folder="${folderName}">
             <div class="start flex align-item-center">
                <i class="ri-music-2-line"></i>
                <div class="info">
                    <div class="song-name">${song.replaceAll("%20", " ")}</div>
                    <div class="song-artist"><p>Sujal Kidecha</p></div>
                </div>
             </div>
             <i class="ri-play-fill fs-2_5"></i>
            </li>`;
    }

    // Re-attach event listeners with folder info
    attachSongListenersWithFolder();
}

// Separate function for attaching song click listeners
function attachSongListeners() {
    Array.from(document.querySelector(".song-list").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            console.log(e.querySelector(".info").firstElementChild.innerHTML)
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim())
        })
    })
}

// New function for attaching song listeners with folder info
function attachSongListenersWithFolder() {
    Array.from(document.querySelector(".song-list").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            let songName = e.querySelector(".info").firstElementChild.innerHTML.trim();
            let folderName = e.dataset.folder;
            
            console.log("Playing song:", songName, "from folder:", folderName);
            
            // Update global variables when user clicks on a song
            currFolder = `songs/${folderName}`;
            playMusic(songName);
            
            // Update global songs array for next/previous functionality
            getsongs(`songs/${folderName}`).then(loadedSongs => {
                songs = loadedSongs;
                console.log("Updated global songs array:", songs);
            });
        })
    })
}

const playMusic = (track) => {
    currentSong.src = `/${currFolder}/` + track
    currentSong.play()
    currentTrack = track;

    play.classList.remove("ri-play-large-fill");
    play.classList.add("ri-pause-mini-fill");

    let musicName = document.querySelector(".playing-song .music-content h5");
    let artistName = document.querySelector(".playing-song .music-content h6");

    if (musicName) musicName.innerText = track.replaceAll("%20", " ");  // song name
    if (artistName) artistName.innerText = "Sujal Kidecha";
    
    // Update sidebar icons - reset all to play icon first
    updateSidebarIcons(track);
}

// Function to update sidebar icons based on current playing song
function updateSidebarIcons(currentTrack) {
    let songItems = document.querySelectorAll(".song-list li");
    
    songItems.forEach(item => {
        let songIcon = item.querySelector("i.ri-play-fill, i.ri-pause-mini-fill");
        let songName = item.querySelector(".song-name").textContent.trim();
        
        if (songName === currentTrack.replaceAll("%20", " ")) {
            // Current playing song - show pause icon
            songIcon.classList.remove("ri-play-fill");
            songIcon.classList.add("ri-pause-mini-fill");
        } else {
            // Other songs - show play icon
            songIcon.classList.remove("ri-pause-mini-fill");
            songIcon.classList.add("ri-play-fill");
        }
    });
}

// FIXED: Complete displayAlbums function
async function displayAlbums() {
    let a = await fetch(`http://127.0.0.1:5500/songs/`)
    let response = await a.text()
    let div = document.createElement("div")
    div.innerHTML = response;
    let anchor = div.getElementsByTagName("a")
    let allSongs = document.querySelector(".allSongs")
    
    // Clear existing content
    allSongs.innerHTML = ""

    // Use for...of loop instead of forEach for proper async handling
    for (let e of anchor) {
        if (e.href.includes("/songs") && e.href !== "http://127.0.0.1:5500/songs/") {
            let cleanHref = e.href.replace(/\/$/, '');
            let folder = cleanHref.split("/").slice(-1)[0];
            
            console.log("Processing folder:", folder); // Debug log
            
            if (folder && folder !== "songs" && folder !== "") {
                try {
                    let a = await fetch(`http://127.0.0.1:5500/songs/${folder}/info.json`);
                    let response = await a.json()
                    console.log("Loaded album info:", folder, response)
                    
                    // FIXED: Use actual folder name instead of hardcoded "song-1"
                    allSongs.innerHTML += `<div data-folder="${folder}" class="song-card">
                        <img src="songs/${folder}/cover.jpeg" alt="" onerror="this.src='default-cover.jpg'">
                        <p>${response.Title || response.title || folder}</p>
                        <div class="play-button">
                            <i class="ri-play-fill"></i>
                        </div>
                    </div>`
                } catch (err) {
                    console.error("Error fetching info.json for", folder, err);
                    // Still show folder even if info.json fails
                    allSongs.innerHTML += `<div data-folder="${folder}" class="song-card">
                        <img src="songs/${folder}/cover.jpeg" alt="" onerror="this.src='default-cover.jpg'">
                        <p>${folder}</p>
                        <div class="play-button">
                            <i class="ri-play-fill"></i>
                        </div>
                    </div>`
                }
            }
        }
    }
    
    // FIXED: Add event listeners AFTER all cards are loaded
    console.log("Adding event listeners to", document.getElementsByClassName("song-card").length, "cards");
    
    // Use event delegation - more efficient and reliable
    allSongs.addEventListener("click", async (event) => {
        let targetCard = event.target.closest('.song-card');
        
        if (targetCard) {
            let folderName = targetCard.dataset.folder;
            console.log("Playlist clicked:", folderName);

            try {
                // New playlist ke songs load karo
                songs = await getsongs(`songs/${folderName}`);
                console.log("Loaded songs for", folderName, ":", songs);
                updateSidebar(songs);
                

            } catch (error) {
                console.error("Error loading playlist:", error);
            }
        }
    });
}

async function main() {
    // Default playlist load karo
    songs = await getsongs("songs/song-1")
    console.log("Initial songs loaded:", songs);

    // Display all the albums on the page 
    await displayAlbums() // FIXED: Wait for albums to load

    // Initial sidebar update
    updateSidebar(songs);

    play.addEventListener("click", () => {
        togglePlayPause(songs);
    });

    // Listen for timeupdate event
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".current-time").innerHTML =
            secondsToMinutesSeconds(Math.floor(currentSong.currentTime));

        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
        if (!isNaN(currentSong.duration)) {
            document.querySelector(".total-time").innerHTML =
                secondsToMinutesSeconds(Math.floor(currentSong.duration));
        }
    })

    // add an event listener to seekbar 
    document.querySelector(".seekBar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100
    })

    // Spacebar control
    document.addEventListener("keydown", (event) => {
        if (event.code === "Space") {
            event.preventDefault();
            togglePlayPause(songs);
        }
    });

    function togglePlayPause(songs) {
        if (!currentTrack) {
            if (songs.length > 0) {
                playMusic(songs[0]);
            }
        } else {
            if (currentSong.paused) {
                currentSong.play();
                play.classList.remove("ri-play-large-fill");
                play.classList.add("ri-pause-mini-fill");
            } else {
                currentSong.pause();
                play.classList.remove("ri-pause-mini-fill");
                play.classList.add("ri-play-large-fill");
            }
        }
    }

    // Volume control
    let volumeSeekbar = document.getElementById("volume");
    volumeSeekbar.addEventListener("input", function () {
        currentSong.volume = this.value;
    });

    // Hamburger menu
    document.querySelector(".hame-burger").addEventListener("click", () => {
        document.querySelector(".library").style.left = "0"
    })
    document.querySelector(".close-icon").addEventListener("click", () => {
        document.querySelector(".library").style.left = "-105%"
    })

    // Previous and Next buttons
    let previous = document.getElementById("previous");
    let next = document.getElementById("next");

    previous.addEventListener("click", () => {
        console.log("previoused")
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1])
        } else {
            playMusic(songs[songs.length - 1])
        }
    })

    next.addEventListener("click", () => {
        currentSong.pause()
        console.log("nexted")
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1])
        } else {
            playMusic(songs[0]);
        }
    })

    currentSong.addEventListener("ended", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if (index + 1 < songs.length) {
            playMusic(songs[index + 1]);
        } else {
            playMusic(songs[0]);
        }
    });
}

main()