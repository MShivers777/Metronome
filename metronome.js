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
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let isPlaying = false;
    let currentBeat = 0;
    let tempo = 120;
    let beatsPerMeasure = 4;
    let noteValue = 4;
    let polyrhythmNumerator = 3;
    let polyrhythmDenominator = 2;
    let sounds = {
        "click": "click.wav",
        "woodblock": "woodblock.wav",
        "beep": "beep.wav",
        "clave": "clave.wav",
        "hihat": "hihat.wav"
    };
    let selectedSound = "click";

    // Ensure elements exist before accessing them
    const tempoInput = document.getElementById("tempo");
    const beatsInput = document.getElementById("beats");
    const noteValueInput = document.getElementById("noteValue");
    const soundSelect = document.getElementById("sound");
    const polyrhythmInputNum = document.getElementById("polyNum");
    const polyrhythmInputDen = document.getElementById("polyDen");
    const increaseTempoEveryInput = document.getElementById("increase-tempo");
    const increaseAmountInput = document.getElementById("increase-amount");

    function updateBeatIndicator(beatsPerMeasure) {
        let indicator = document.getElementById("beatIndicator");
        indicator.innerHTML = "";
        for (let i = 0; i < beatsPerMeasure; i++) {
            let div = document.createElement("div");
            div.classList.add("beat");
            if (i === 0) div.classList.add("active");
            indicator.appendChild(div);
        }
    }

    function highlightBeat(beat) {
        let beats = document.querySelectorAll(".beat");
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
    }

    function scheduleBeats() {
        if (!isPlaying) return;
        const interval = (60 / tempo) * 1000;
        playClick();
        highlightBeat(currentBeat);
        currentBeat = (currentBeat + 1) % beatsPerMeasure;
        setTimeout(scheduleBeats, interval);
    }

    function playClick() {
        let sound = new Audio(sounds[selectedSound]);
        sound.play();
    }

    // Update settings live
    [tempoInput, beatsInput, noteValueInput, soundSelect, polyrhythmInputNum, polyrhythmInputDen, increaseTempoEveryInput, increaseAmountInput].forEach(input => {
        input.addEventListener("input", () => {
            tempo = parseInt(tempoInput.value);
            beatsPerMeasure = parseInt(beatsInput.value);
            noteValue = parseInt(noteValueInput.value);
            selectedSound = soundSelect.value;
            polyrhythmNumerator = parseInt(polyrhythmInputNum.value);
            polyrhythmDenominator = parseInt(polyrhythmInputDen.value);
            increaseTempoEvery = parseInt(increaseTempoEveryInput.value);
            increaseAmount = parseInt(increaseAmountInput.value);
        });
    });

    // UI Adjustments for Time Signature
    beatsInput.min = 1;
    noteValueInput.min = 1;
    beatsInput.max = 32;
    noteValueInput.max = 32;

    updateBeatIndicator(beatsPerMeasure);

    let measureCount = 0;

    function startMetronome() {
        let interval = (60 / tempo) * 1000;
        currentBeat = 0;
        measureCount = 0;
        isPlaying = true;
        document.getElementById("startStop").textContent = "Stop";

        timer = setInterval(() => {
            playClick();
            highlightBeat(currentBeat);

            if (polyrhythmNumerator && polyrhythmDenominator) {
                if (currentBeat % polyrhythmDenominator === 0) playClick();
            }

            currentBeat++;
            
            if (currentBeat % beatsPerMeasure === 0) {
                measureCount++;
                if (measureCount % increaseTempoEvery === 0) {
                    tempo += increaseAmount;
                    interval = (60 / tempo) * 1000;
                    clearInterval(timer);
                    startMetronome();
                }
            }
        }, interval);
    }

    document.getElementById("startStop").addEventListener("click", () => {
        if (isPlaying) {
            stopMetronome();
            document.getElementById("startStop").textContent = "Start";
        } else {
            startMetronome();
        }
    });
});
