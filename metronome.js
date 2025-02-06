// Metronome Code with Updates

document.addEventListener("DOMContentLoaded", function () {
    console.log("Screen loaded");
    
    // document.getElementById("login-form").addEventListener("submit", function(event) {
    //     event.preventDefault();
    //     console.log("Login button pressed");
    //     // const password = "ontime";
    //     // const userPassword = document.getElementById("password").value;
    //     // console.log("Entered password:", userPassword);
        
    //     // if (userPassword !== password) {
    //     //     alert("Incorrect password. Access denied.");
    //     //     return;
    //     // }

    //     console.log("Password check skipped");
    //     document.getElementById("login-form").style.display = "none";
    //     document.getElementById("loading").style.display = "block";
    //     setTimeout(() => {
    //         window.location.href = "metronome.html";
    //     }, 1000);
    // });

    console.log("DOM fully loaded and parsed");
    const startButton = document.getElementById('start');
    const stopButton = document.getElementById('stop');
    const practiceOnButton = document.getElementById('practiceOn');
    const beatBoxesContainer = document.getElementById('beatBoxes');
    
    if (startButton) {
        startButton.addEventListener('click', () => {
            console.log("Start button pressed");
            startMetronome();
            startButton.disabled = true;
            beatBoxesContainer.classList.add('running');
        });
    }
    
    if (stopButton) {
        stopButton.addEventListener('click', () => {
            console.log("Stop button pressed");
            stopMetronome();
            startButton.disabled = false;
            beatBoxesContainer.classList.remove('running');
        });
    }
    
    if (practiceOnButton) {
        practiceOnButton.addEventListener('click', () => {
            console.log("Practice mode toggled");
            // Add functionality for practice mode here
        });
    }

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let isPlaying = false;
    let currentBeat = 0;
    let tempo = 120;
    let beatsPerMeasure = 4;
    let selectedSound = "hi-hat";
    let timer;

    // Ensure elements exist before accessing them
    const tempoInput = document.getElementById("tempo");
    const beatsInput = document.getElementById("beats");
    const soundSelect = document.getElementById("sound");

    function highlightBeat(beat) {
        let beats = document.querySelectorAll(".beat-box");
        beats.forEach((b, index) => {
            b.classList.toggle("active", index === beat);
        });
    }

    function playMetronome() {
        if (!isPlaying) {
            isPlaying = true;
            scheduleBeats();
        }
    }

    function stopMetronome() {
        isPlaying = false;
        clearTimeout(timer);
    }

    function scheduleBeats() {
        if (!isPlaying) return;
        const interval = (60 / tempo) * 1000;
        playClick();
        highlightBeat(currentBeat);
        currentBeat = (currentBeat + 1) % beatsPerMeasure;
        timer = setTimeout(scheduleBeats, interval);
    }

    function playClick() {
        let sound = new Audio(`./sounds/${selectedSound}.wav`);
        sound.play().catch(error => {
            console.error("Audio playback failed:", error);
        });
    }

    [tempoInput, beatsInput, soundSelect].forEach(input => {
        input.addEventListener("input", () => {
            tempo = parseInt(tempoInput.value);
            beatsPerMeasure = parseInt(beatsInput.value);
            selectedSound = soundSelect.value;
            updateBeatBoxes();
        });
    });

    function startMetronome() {
        let interval = (60 / tempo) * 1000;
        currentBeat = 0;
        isPlaying = true;
        timer = setInterval(() => {
            playClick();
            highlightBeat(currentBeat);
            currentBeat = (currentBeat + 1) % beatsPerMeasure;
        }, interval);
    }

    // Attach startMetronome and stopMetronome to the window object
    window.startMetronome = startMetronome;
    window.stopMetronome = stopMetronome;

    updateBeatBoxes(); // Initial call to set up beat boxes
});
