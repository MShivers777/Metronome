document.addEventListener("DOMContentLoaded", async function () {
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
    
    // NEW: Polyrhythm elements & state variables
    const polyModeCheckbox = document.getElementById("polyMode");
    const polyBeatsInput = document.getElementById("poly-beats");
    const polyBeatBoxesContainer = document.getElementById("polyBeatBoxes");
    const polyBeatGroupContainer = document.getElementById("poly-beats-group");
    let polyEnabled = false;
    let polyGlobalBeat = 0; // counts main beats for poly timing

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

    // NEW: poly beats per measure (will be read from polyBeatsInput)
    let polyBeats = parseInt(polyBeatsInput.value, 10) || 3;

    // Initialize currentTempo with the slider value
    currentTempo = parseInt(tempoSlider.value, 10);

    function playClick(frequency) {
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioContext.destination);

        osc.type = 'sine';
        osc.frequency.value = frequency;
        gainNode.gain.setValueAtTime(1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.1);
    }

    function resumeAudioContext() {
        if (audioContext.state === "suspended") {
            audioContext.resume();
        }
    }

    // Ensure audio context is resumed on user interaction
    document.addEventListener('click', resumeAudioContext);
    document.addEventListener('touchstart', resumeAudioContext);

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
        
        if (isDownbeat) {
            playClick(880); // High frequency for downbeat
        } else if (isMainBeat) {
            playClick(440); // Medium frequency for main beat
        } else {
            playClick(660); // Low frequency for subdivision
        }
        
        // Always update highlight (main beat and subdivisions)
        highlightBeat(currentBeat);
        
        // NEW: When a main beat occurs, update poly beats too
        if (isMainBeat && polyEnabled) {
            polyGlobalBeat++;
            highlightPolyBeat();
        }

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
        resumeAudioContext();

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
        polyGlobalBeat = 0; // reset poly counter
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

    // NEW: Update poly beat boxes to display one box per beat, with no subdivisions
    function updatePolyBeatBoxes() {
        polyBeatBoxesContainer.innerHTML = '';
        const polyCount = parseInt(polyBeatsInput.value, 10) || 3;
        for (let i = 0; i < polyCount; i++) {
            const box = document.createElement('div');
            box.className = 'beat-box main-beat';
            box.style.flex = `1 0 ${(100 / polyCount)}%`; // Ensure equal width for poly beats
            polyBeatBoxesContainer.appendChild(box);
        }
    }

    // NEW: Highlight poly beat boxes without using subdivision offsets
    function highlightPolyBeat() {
        const polyBoxes = polyBeatBoxesContainer.querySelectorAll(".beat-box");
        polyBoxes.forEach(box => box.classList.remove('active'));
        const polyCount = polyBoxes.length;
        const activeIndex = polyGlobalBeat % polyCount;
        if (activeIndex < polyBoxes.length) {
            polyBoxes[activeIndex].classList.add('active');
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

    // NEW: Listen for changes on the polyrhythm switch and poly beats input
    polyModeCheckbox.addEventListener('change', () => {
        polyEnabled = polyModeCheckbox.checked;
        const displayStyle = polyEnabled ? "block" : "none";
        polyBeatGroupContainer.style.display = displayStyle;
        polyBeatBoxesContainer.style.display = displayStyle;
        if (polyEnabled) {
            updatePolyBeatBoxes();
        }
    });
    polyBeatsInput.addEventListener('change', () => {
        polyBeats = parseInt(polyBeatsInput.value, 10) || 3;
        updatePolyBeatBoxes();
    });
    subdivisionSelect.addEventListener('change', () => {
        subdivisionValue = parseInt(subdivisionSelect.value, 10);
        currentSubdivision = 0;
        updateBeatBoxes();
        if(polyEnabled) updatePolyBeatBoxes();
    });
    beatsInput.addEventListener('input', updateBeatBoxes);
    polyBeatsInput.addEventListener('input', updatePolyBeatBoxes);
    updateBeatBoxes();

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
