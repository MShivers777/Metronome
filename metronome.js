document.addEventListener("DOMContentLoaded", function () {
    console.log("Metronome loaded");

    const startButton = document.getElementById("start");
    const stopButton = document.getElementById("stop");
    const tempoInput = document.getElementById("tempo");
    const beatsInput = document.getElementById("beats");

    let audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let isPlaying = false;
    let currentBeat = 0;
    let nextNoteTime = 0;
    let scheduler;
    
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

        osc.frequency.value = isDownbeat ? 880 : 440; // Higher pitch for downbeat
        gainNode.gain.setValueAtTime(1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.1);
    }

    function scheduleNextBeat() {
        if (!isPlaying) return;
        
        let tempo = parseInt(tempoInput.value, 10);
        let beatsPerMeasure = parseInt(beatsInput.value, 10);
        let interval = (60.0 / tempo); // Seconds per beat

        nextNoteTime += interval;

        playClick(currentBeat === 0);
        highlightBeat(currentBeat);
        
        currentBeat = (currentBeat + 1) % beatsPerMeasure;

        scheduler = setTimeout(scheduleNextBeat, (nextNoteTime - audioContext.currentTime) * 1000);
    }

    function startMetronome() {
        if (isPlaying) return;
        resumeAudioContext();

        isPlaying = true;
        currentBeat = 0;
        nextNoteTime = audioContext.currentTime;
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

    document.getElementById('beats').addEventListener('input', updateBeatBoxes);
    updateBeatBoxes(); // Initial call to set up beat boxes

    startButton.addEventListener("click", startMetronome);
    stopButton.addEventListener("click", stopMetronome);

    window.startMetronome = startMetronome;
    window.stopMetronome = stopMetronome;
});
