document.getElementById("compressBtn").addEventListener("click", async () => {
  const audioInput = document.getElementById("audioInput");
  const audioFile = audioInput.files[0];

  if (!audioFile) {
    alert("Please select an audio file.");
    return;
  }

  try {
    const compressedAudioBlob = await compressAudio(audioFile);
    const compressedAudioURL = URL.createObjectURL(compressedAudioBlob);
    const audioPlayer = document.getElementById("audioPlayer");
    audioPlayer.src = compressedAudioURL;
    audioPlayer.play();

    const downloadLink = document.getElementById("downloadLink");
    downloadLink.href = compressedAudioURL;
    downloadLink.download = "compressed_audio.wav";
    downloadLink.click();

    alert("Audio compressed successfully.");
  } catch (error) {
    alert("Error compressing audio.");
    console.error(error);
  }
});

function compressAudio(audioFile) {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        const arrayBuffer = reader.result;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const compressedBuffer = await compressBuffer(audioBuffer);
        const compressedBlob = await bufferToBlob(compressedBuffer);
        resolve(compressedBlob);
      };
      reader.onerror = () => {
        reject("Error reading audio file.");
      };
      reader.readAsArrayBuffer(audioFile);
    } catch (error) {
      reject(error);
    }
  });
}

function compressBuffer(audioBuffer) {
  return new Promise((resolve) => {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, audioContext.currentTime);
    compressor.knee.setValueAtTime(40, audioContext.currentTime);
    compressor.ratio.setValueAtTime(12, audioContext.currentTime);
    compressor.attack.setValueAtTime(0, audioContext.currentTime);
    compressor.release.setValueAtTime(0.25, audioContext.currentTime);

    source.connect(compressor);
    compressor.connect(audioContext.destination);

    source.start();
    audioContext.oncomplete = (event) => {
      const compressedBuffer = event.renderedBuffer;
      resolve(compressedBuffer);
    };
  });
}

function bufferToBlob(buffer) {
  return new Promise((resolve) => {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const audioBuffer = audioContext.createBuffer(
      1,
      buffer.length,
      audioContext.sampleRate
    );
    audioBuffer.getChannelData(0).set(buffer);

    const audioBlob = new Blob([buffer], { type: "audio/wav" });
    resolve(audioBlob);
  });
}
