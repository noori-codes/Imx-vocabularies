let cachedVoices = [];
let currentAudio = null;

export const loadVoices = () => {
  if (!window.speechSynthesis) return [];
  cachedVoices = window.speechSynthesis.getVoices();
  return cachedVoices;
};

if (typeof window !== "undefined" && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
}

const pickEnglishVoice = () => {
  const voices = cachedVoices.length ? cachedVoices : loadVoices();
  if (!voices.length) return null;
  return (
    voices.find(
      (voice) =>
        /en-US/i.test(voice.lang) &&
        /google|neural|premium|natural/i.test(voice.name),
    ) ||
    voices.find((voice) => /en-US/i.test(voice.lang)) ||
    voices.find((voice) => /^en(-|$)/i.test(voice.lang)) ||
    voices[0]
  );
};

export const showSpeakFeedback = (message, isError = false) => {
  let toast = document.getElementById("speakToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "speakToast";
    toast.className = "speak-toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.toggle("is-error", isError);
  toast.classList.add("is-visible");
  window.clearTimeout(showSpeakFeedback._timer);
  showSpeakFeedback._timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 3500);
};

export const stopSpeaking = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

const playAudioUrl = (url) =>
  new Promise((resolve, reject) => {
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onended = () => {
      currentAudio = null;
      resolve(true);
    };
    audio.onerror = () => {
      currentAudio = null;
      reject(new Error("audio failed"));
    };
    audio.play().then(() => {}).catch(reject);
  });

const speakWithDictionaryAudio = async (phrase) => {
  const cleaned = phrase.toLowerCase().trim();
  const candidates = [
    cleaned,
    cleaned.split(/\s+/)[0],
    cleaned.replace(/-/g, ""),
    cleaned.replace(/[^a-z'-]/gi, ""),
  ].filter((item, index, arr) => item && arr.indexOf(item) === index);

  for (const query of candidates) {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query)}`,
    );
    if (!response.ok) continue;

    const data = await response.json();
    const audioUrl = (data || [])
      .flatMap((entry) => entry.phonetics || [])
      .map((item) => item.audio)
      .find((src) => typeof src === "string" && src.trim());

    if (!audioUrl) continue;
    await playAudioUrl(audioUrl);
    return true;
  }

  return false;
};

const speakWithSpeechSynthesis = (phrase) =>
  new Promise((resolve, reject) => {
    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== "function") {
      reject(new Error("unsupported"));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = "en-US";
    utterance.rate = 0.92;
    utterance.pitch = 1;

    const voice = pickEnglishVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || "en-US";
    } else if (!loadVoices().length) {
      reject(new Error("no-voices"));
      return;
    }

    utterance.onend = () => resolve(true);
    utterance.onerror = (event) => {
      if (event.error === "canceled" || event.error === "interrupted") {
        resolve(false);
        return;
      }
      reject(new Error(event.error || "synthesis-error"));
    };

    const start = () => {
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
      window.setTimeout(start, 60);
    } else {
      start();
    }
  });

const speakWithOnlineTts = async (phrase) => {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(
    phrase.slice(0, 100),
  )}`;
  await playAudioUrl(url);
  return true;
};

export const speakWord = async (text) => {
  const phrase = String(text || "").trim();
  if (!phrase) return;

  stopSpeaking();

  try {
    if (await speakWithDictionaryAudio(phrase)) return;
  } catch (error) {
    console.warn("Dictionary audio unavailable", error);
  }

  try {
    await speakWithSpeechSynthesis(phrase);
    return;
  } catch (error) {
    console.warn("Speech synthesis unavailable", error);
  }

  try {
    if (await speakWithOnlineTts(phrase)) return;
  } catch (error) {
    console.warn("Online TTS unavailable", error);
  }

  showSpeakFeedback(
    "Pronunciation unavailable. Allow network audio, or fix Linux speech-dispatcher.",
    true,
  );
};
