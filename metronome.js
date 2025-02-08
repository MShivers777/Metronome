document.addEventListener("DOMContentLoaded", function () {
    console.log("Metronome loaded");

    const startButton = document.getElementById("start");
    const stopButton = document.getElementById("stop");
    const beatsInput = document.getElementById("beats");
    const practiceSlider = document.getElementById("practiceOn");
    const increaseTempoInput = document.getElementById("increase-tempo");
    const increaseAmountInput = document.getElementById("increase-amount");
    const startTempoInput = document.getElementById("start-tempo");
    const finalTempoInput = document.getElementById("final-tempo");
    const totalPracticeTimeDisplay = document.getElementById("total-practice-time");
    const practiceSettings = document.getElementById("practice-settings");
    const tempoDisplay = document.getElementById("tempo-display");
    const tempoSlider = document.getElementById("tempo-slider");
    const beatBoxesContainer = document.getElementById('beatBoxes');
    const tempoDisplayContainer = document.querySelector('.tempo-display');
    const subdivisionSelect = document.getElementById("subdivision");
    
    let audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let isPlaying = false;
    let isPracticeMode = false;
    let currentBeat = 0;
    let nextNoteTime = 0;
    let scheduler;
    let currentTempo;
    let measureCount = 0;
    let currentSubdivision = 0;
    let subdivisionValue = 1;

    // Initialize currentTempo with the slider value
    currentTempo = parseInt(tempoSlider.value, 10);

    // Add mobile detection
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Pre-load audio for mobile devices
    const clickHigh = new Audio('data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ4AAABkAGQAAABkAAAAZABkAA==');
    const clickLow = new Audio('data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQYAAAA5ADkAAAA5AAAAOQA5AA==');
    const clickSub = new Audio('data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ4AAAAAAQAAAAEAAAABAAAAAQAx');

    function resumeAudioContext() {
        if (audioContext.state === "suspended") {
            audioContext.resume();
        }
    }

    function playClick(isDownbeat, isMainBeat) {
        if (isMobile) {
            const click = isDownbeat ? clickHigh : (isMainBeat ? clickLow : clickSub);
            click.currentTime = 0;
            click.play().catch(error => console.log("Audio playback failed:", error));
        } else {
            const osc = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Different frequencies for different types of beats
            osc.frequency.value = isDownbeat ? 880 : (isMainBeat ? 440 : 660);
            gainNode.gain.setValueAtTime(isMainBeat ? 1 : 0.7, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
            
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + 0.1);
        }
    }

    function resetAnimation(element, className) {
        element.classList.remove(className);
        void element.offsetWidth; // Trigger reflow
        element.classList.add(className);
    }

    function scheduleNextBeat() {
        if (!isPlaying) return;
        
        const beatsPerMeasure = parseInt(beatsInput.value, 10);
        subdivisionValue = parseInt(subdivisionSelect.value, 10);
        const interval = (60.0 / currentTempo) / subdivisionValue;

        nextNoteTime += interval;
        
        const isMainBeat = currentSubdivision === 0;
        const isDownbeat = currentBeat === 0 && isMainBeat;
        
        playClick(isDownbeat, isMainBeat);
        
        // Always update highlight (main beat and subdivisions)
        highlightBeat(currentBeat);
        
        if (isMainBeat) {
            // Handle measure changes and tempo updates
            if (currentBeat === 0) {
                if (isPracticeMode && measureCount > 0 && 
                    measureCount % parseInt(increaseTempoInput.value, 10) === 0) {
                    currentTempo += parseInt(increaseAmountInput.value, 10);
                    if (currentTempo > parseInt(finalTempoInput.value, 10)) {
                        currentTempo = parseInt(finalTempoInput.value, 10);
                    }
                    tempoDisplay.textContent = currentTempo;
                    tempoSlider.value = currentTempo;
                    resetAnimation(tempoDisplayContainer, 'tempo-change');
                    console.log("Tempo increased to: " + currentTempo);
                }
                resetAnimation(beatBoxesContainer, 'measure-start');
            }
        }

        currentSubdivision = (currentSubdivision + 1) % subdivisionValue;
        if (currentSubdivision === 0) {
            currentBeat = (currentBeat + 1) % beatsPerMeasure;
            if (currentBeat === 0) {
                measureCount++;
            }
        }

        scheduler = setTimeout(scheduleNextBeat, 
            (nextNoteTime - audioContext.currentTime) * 1000);
    }

    function startMetronome() {
        if (isPlaying) return;
        
        // Ensure audio context is running
        if (!isMobile) {
            resumeAudioContext();
        }

        isPlaying = true;
        currentBeat = 0;
        nextNoteTime = audioContext.currentTime;
        
        // Set initial tempo
        if (isPracticeMode) {
            currentTempo = parseInt(startTempoInput.value, 10);
        } else {
            currentTempo = parseInt(tempoSlider.value, 10);
        }
        
        updateTempoDisplay(currentTempo);
        tempoSlider.value = currentTempo;
        
        measureCount = 0;
        scheduleNextBeat();
        
        startButton.disabled = true;
        stopButton.disabled = false;
    }

    function stopMetronome() {
        isPlaying = false;
        clearTimeout(scheduler);
        startButton.disabled = false;
        stopButton.disabled = true;
    }

    // Hide practice mode initially
    practiceSettings.classList.remove('visible');
    
    function togglePracticeMode() {
        isPracticeMode = practiceSlider.checked;
        if (isPracticeMode) {
            practiceSettings.classList.add('visible');
        } else {
            practiceSettings.classList.remove('visible');
        }
        console.log("Practice mode: " + (isPracticeMode ? "ON" : "OFF"));
        calculateTotalPracticeTime();
    }

    function highlightBeat(beat) {
        const subdivisionType = parseInt(subdivisionSelect.value, 10);
        const beatBoxes = document.querySelectorAll(".beat-box");

        // Clear all highlights first
        beatBoxes.forEach(box => box.classList.remove('active'));

        // Calculate the index of the current box that should be highlighted
        let activeBoxIndex = beat;
        if (subdivisionType > 1) {
            const subdivCount = subdivisionType - 1;
            activeBoxIndex = beat * (subdivCount + 1) + currentSubdivision;
        }

        // Highlight the appropriate box
        if (activeBoxIndex < beatBoxes.length) {
            beatBoxes[activeBoxIndex].classList.add('active');
        }
    }

    function updateBeatBoxes() {
        const beats = parseInt(beatsInput.value, 10);
        const subdivisionType = parseInt(subdivisionSelect.value, 10);
        const beatBoxes = document.getElementById('beatBoxes');
        beatBoxes.innerHTML = '';
        beatBoxes.dataset.subdivision = subdivisionType; // Add subdivision type as data attribute

        const subdivCount = subdivisionType - 1; // Number of subdivisions per beat

        for (let i = 0; i < beats; i++) {
            // Create main beat box
            const box = document.createElement('div');
            box.className = 'beat-box main-beat';
            beatBoxes.appendChild(box);

            // Always add subdivision boxes if subdivisions exist, even for the last beat
            if (subdivCount > 0) {
                for (let j = 0; j < subdivCount; j++) {
                    const subBox = document.createElement('div');
                    subBox.className = 'beat-box subdivision-box';
                    subBox.dataset.subdivision = j + 1;
                    subBox.dataset.mainBeat = i;
                    beatBoxes.appendChild(subBox);
                }
            }
        }
    }

    function updateStartTempo() {
        updateTempoDisplay(startTempoInput.value);
        tempoSlider.value = startTempoInput.value;
    }

    function calculateTotalPracticeTime() {
        const startTempo = parseInt(startTempoInput.value, 10);
        const finalTempo = parseInt(finalTempoInput.value, 10);
        const increaseTempo = parseInt(increaseTempoInput.value, 10);
        const increaseAmount = parseInt(increaseAmountInput.value, 10);

        if (isPracticeMode && startTempo < finalTempo && increaseAmount > 0) {
            const totalMeasures = Math.ceil((finalTempo - startTempo) / increaseAmount) * increaseTempo;
            const totalTimeInSeconds = totalMeasures * (60 / startTempo) * beatsInput.value;
            const minutes = Math.floor(totalTimeInSeconds / 60);
            const seconds = Math.round(totalTimeInSeconds % 60);
            totalPracticeTimeDisplay.textContent = `Total Practice Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        } else {
            totalPracticeTimeDisplay.textContent = '';
        }
    }

    function updateTempoDisplay(value) {
        tempoDisplay.textContent = value;
        currentTempo = parseInt(value, 10);
    }

    tempoSlider.addEventListener('input', (e) => {
        const newTempo = parseInt(e.target.value, 10);
        updateTempoDisplay(newTempo);
        if (!isPracticeMode) {
            currentTempo = newTempo;
        }
    });

    tempoDisplay.addEventListener('click', () => {
        const newTempo = prompt('Enter BPM:', currentTempo);
        if (newTempo && !isNaN(newTempo) && newTempo >= 30 && newTempo <= 300) {
            updateTempoDisplay(newTempo);
            tempoSlider.value = newTempo;
        }
    });

    document.getElementById('beats').addEventListener('input', updateBeatBoxes);
    updateBeatBoxes();

    // Enforce min/max limits for practice mode inputs
    [startTempoInput, finalTempoInput, increaseTempoInput, increaseAmountInput].forEach(input => {
        input.addEventListener('change', () => {
            const min = parseInt(input.min, 10);
            const max = parseInt(input.max, 10);
            let value = parseInt(input.value, 10);
            if (value < min) {
                input.value = min;
            } else if (value > max) {
                input.value = max;
            }
        });
    });

    startButton.addEventListener("click", startMetronome);
    stopButton.addEventListener("click", stopMetronome);
    practiceSlider.addEventListener("change", togglePracticeMode);
    startTempoInput.addEventListener("input", updateStartTempo);
    increaseTempoInput.addEventListener("input", calculateTotalPracticeTime);
    increaseAmountInput.addEventListener("input", calculateTotalPracticeTime);
    finalTempoInput.addEventListener("input", calculateTotalPracticeTime);
    subdivisionSelect.addEventListener('change', (e) => {
        subdivisionValue = parseInt(e.target.value, 10);
        currentSubdivision = 0;
        updateBeatBoxes(); // Rebuild beat boxes when subdivision changes
    });

    window.startMetronome = startMetronome;
    window.stopMetronome = stopMetronome;
});
