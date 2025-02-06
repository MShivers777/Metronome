document.addEventListener("DOMContentLoaded", function () {
    console.log("Metronome loaded");

    const startButton = document.getElementById("start");
    const stopButton = document.getElementById("stop");
    const tempoInput = document.getElementById("tempo");
    const beatsInput = document.getElementById("beats");
    const practiceSlider = document.getElementById("practiceOn");
    const increaseTempoInput = document.getElementById("increase-tempo");
    const increaseAmountInput = document.getElementById("increase-amount");
    const startTempoInput = document.getElementById("start-tempo");
    const finalTempoInput = document.getElementById("final-tempo");
    const totalPracticeTimeDisplay = document.getElementById("total-practice-time");
    
    let audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let isPlaying = false;
    let isPracticeMode = false;
    let currentBeat = 0;
    let nextNoteTime = 0;
    let scheduler;
    let currentTempo;
    let measureCount = 0;

    function resumeAudioContext() {
        if (audioContext.state === "suspended") {
            audioContext.resume();
        }
    }

    function playClick(isDownbeat) {
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioContext.destination);

        osc.frequency.value = isDownbeat ? 880 : 440;
        gainNode.gain.setValueAtTime(1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.1);
    }

    function scheduleNextBeat() {
        if (!isPlaying) return;
        
        let beatsPerMeasure = parseInt(beatsInput.value, 10);
        let interval = (60.0 / currentTempo);

        nextNoteTime += interval;
        playClick(currentBeat === 0);
        highlightBeat(currentBeat);
        
        currentBeat = (currentBeat + 1) % beatsPerMeasure;
        if (currentBeat === 0) {
            measureCount++;
            if (isPracticeMode && measureCount % parseInt(increaseTempoInput.value, 10) === 0) {
                currentTempo += parseInt(increaseAmountInput.value, 10);
                if (currentTempo > parseInt(finalTempoInput.value, 10)) {
                    currentTempo = parseInt(finalTempoInput.value, 10);
                }
                tempoInput.value = currentTempo;
                console.log("Tempo increased to: " + currentTempo);
            }
        }

        scheduler = setTimeout(scheduleNextBeat, (nextNoteTime - audioContext.currentTime) * 1000);
    }

    function startMetronome() {
        if (isPlaying) return;
        resumeAudioContext();

        isPlaying = true;
        currentBeat = 0;
        nextNoteTime = audioContext.currentTime;
        currentTempo = isPracticeMode ? parseInt(startTempoInput.value, 10) : parseInt(tempoInput.value, 10);
        tempoInput.value = currentTempo; // Update the displayed tempo
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

    function togglePracticeMode() {
        isPracticeMode = practiceSlider.checked;
        console.log("Practice mode: " + (isPracticeMode ? "ON" : "OFF"));
        calculateTotalPracticeTime();
    }

    function highlightBeat(beat) {
        document.querySelectorAll(".beat-box").forEach((b, index) => {
            b.classList.toggle("active", index === beat);
        });
    }

    function updateBeatBoxes() {
        const beats = document.getElementById('beats').value;
        const beatBoxes = document.getElementById('beatBoxes');
        beatBoxes.innerHTML = '';
        for (let i = 0; i < beats; i++) {
            const box = document.createElement('div');
            box.className = 'beat-box';
            beatBoxes.appendChild(box);
        }
    }

    function updateStartTempo() {
        tempoInput.value = startTempoInput.value;
    }

    function calculateTotalPracticeTime() {
        const startTempo = parseInt(startTempoInput.value, 10);
        const finalTempo = parseInt(finalTempoInput.value, 10);
        const increaseTempo = parseInt(increaseTempoInput.value, 10);
        const increaseAmount = parseInt(increaseAmountInput.value, 10);

        if (isPracticeMode && startTempo < finalTempo && increaseAmount > 0) {
            const totalMeasures = Math.ceil((finalTempo - startTempo) / increaseAmount) * increaseTempo;
            const totalTime = totalMeasures * (60 / startTempo) * beatsInput.value;
            totalPracticeTimeDisplay.textContent = `Total Practice Time: ${Math.round(totalTime)} seconds`;
        } else {
            totalPracticeTimeDisplay.textContent = '';
        }
    }

    document.getElementById('beats').addEventListener('input', updateBeatBoxes);
    updateBeatBoxes();
    
    startButton.addEventListener("click", startMetronome);
    stopButton.addEventListener("click", stopMetronome);
    practiceSlider.addEventListener("change", togglePracticeMode);
    startTempoInput.addEventListener("input", updateStartTempo);
    increaseTempoInput.addEventListener("input", calculateTotalPracticeTime);
    increaseAmountInput.addEventListener("input", calculateTotalPracticeTime);
    finalTempoInput.addEventListener("input", calculateTotalPracticeTime);

    window.startMetronome = startMetronome;
    window.stopMetronome = stopMetronome;
});
