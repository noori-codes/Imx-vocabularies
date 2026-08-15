/**
 * Cross-device pronunciation for vocabulary words.
 *
 * Order: cache → Youdao MP3 → Google TTS MP3 → gstatic → Dictionary API → speechSynthesis
 * Failures stay quiet (no technical error toast).
 */

let cachedVoices = [];
let currentAudio = null;
let speakToken = 0;
const audioUrlCache = new Map();
const resolveInflight = new Map();

const PLAY_MS = 5000;
const LOOKUP_MS = 2500;

export const loadVoices = () => {
  if (!window.speechSynthesis) return [];
  cachedVoices = window.speechSynthesis.getVoices();
  return cachedVoices;
};

if (typeof window !== "undefined" && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
}

const normalizePhrase = (text) =>
  String(text || "")
    .trim()
    .replace(/\s+/g, " ");

const keyFor = (phrase) => normalizePhrase(phrase).toLowerCase();

const withTimeout = (promise, ms) =>
  new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });

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
  toast.classList.toggle("is-error", Boolean(isError));
  toast.classList.add("is-visible");
  window.clearTimeout(showSpeakFeedback._timer);
  showSpeakFeedback._timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, isError ? 2600 : 1400);
};

const clearCurrentAudio = () => {
  if (!currentAudio) return;
  try {
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio.onloadeddata = null;
    currentAudio.oncanplaythrough = null;
    currentAudio.pause();
    currentAudio.removeAttribute("src");
    currentAudio.load();
  } catch {
    // ignore
  }
  currentAudio = null;
};

export const stopSpeaking = () => {
  speakToken += 1;
  clearCurrentAudio();
  if (window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
};

const playUrl = (url, token) =>
  new Promise((resolve, reject) => {
    if (token !== speakToken) {
      resolve(false);
      return;
    }

    clearCurrentAudio();
    const audio = new Audio();
    currentAudio = audio;
    audio.preload = "auto";

    let settled = false;
    const done = (ok, error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      if (currentAudio === audio) currentAudio = null;
      if (ok) resolve(true);
      else reject(error || new Error("audio-failed"));
    };

    const timer = window.setTimeout(() => {
      try {
        audio.pause();
      } catch {
        // ignore
      }
      done(false, new Error("timeout"));
    }, PLAY_MS);

    audio.onended = () => done(true);
    audio.onerror = () => done(false, new Error("error"));

    audio.src = url;

    // Start immediately to preserve the user-gesture unlock on mobile.
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise.then(() => {
        // Playing — wait for onended.
      }).catch(() => {
        // Retry once data is ready (common on desktop).
        const retry = () => {
          if (settled || token !== speakToken) return;
          audio.play().then(() => {}).catch((error) => done(false, error));
        };
        audio.onloadeddata = retry;
        audio.oncanplaythrough = retry;
      });
    }
  });

const youdaoUrl = (phrase) =>
  `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(phrase)}&type=2`;

const googleTtsUrl = (phrase) =>
  `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=en&q=${encodeURIComponent(
    phrase.slice(0, 100),
  )}`;

const gstaticUrl = (phrase) => {
  const word = phrase.toLowerCase().replace(/[^a-z'-]/g, "");
  if (!word || /\s/.test(phrase)) return null;
  return `https://ssl.gstatic.com/dictionary/static/sounds/20200429/${word}--_us_1.mp3`;
};

const remoteCandidates = (phrase) =>
  [youdaoUrl(phrase), googleTtsUrl(phrase), gstaticUrl(phrase)].filter(Boolean);

const pickEnglishVoice = () => {
  const voices = cachedVoices.length ? cachedVoices : loadVoices();
  if (!voices.length) return null;
  return (
    voices.find(
      (voice) =>
        /en(-|_)US/i.test(voice.lang) &&
        /google|microsoft|samantha|neural|premium|natural|enhanced/i.test(voice.name),
    ) ||
    voices.find((voice) => /en(-|_)US/i.test(voice.lang)) ||
    voices.find((voice) => /en(-|_)GB/i.test(voice.lang)) ||
    voices.find((voice) => /^en(-|_|$)/i.test(voice.lang)) ||
    voices[0]
  );
};

const speakWithSpeechSynthesis = (phrase, token) =>
  new Promise((resolve) => {
    if (
      token !== speakToken ||
      !window.speechSynthesis ||
      typeof window.SpeechSynthesisUtterance !== "function"
    ) {
      resolve(false);
      return;
    }

    if (!cachedVoices.length) loadVoices();

    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = "en-US";
    utterance.rate = 0.92;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voice = pickEnglishVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || "en-US";
    }

    let settled = false;
    const done = (ok) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(ok);
    };

    const timer = window.setTimeout(() => {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
      done(false);
    }, PLAY_MS);

    utterance.onend = () => done(true);
    utterance.onerror = (event) => {
      if (event.error === "canceled" || event.error === "interrupted") {
        done(false);
        return;
      }
      done(false);
    };

    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }

    window.setTimeout(() => {
      if (token !== speakToken) {
        done(false);
        return;
      }
      try {
        window.speechSynthesis.resume();
      } catch {
        // ignore
      }
      window.speechSynthesis.speak(utterance);
      window.setTimeout(() => {
        try {
          if (window.speechSynthesis.paused) window.speechSynthesis.resume();
        } catch {
          // ignore
        }
      }, 200);
    }, 30);
  });

const fetchDictionaryAudioUrl = async (phrase) => {
  const cleaned = phrase.toLowerCase().trim();
  const candidates = [
    cleaned,
    cleaned.split(/\s+/)[0],
    cleaned.replace(/-/g, " "),
    cleaned.replace(/[^a-z'\s-]/gi, "").trim(),
  ].filter((item, index, arr) => item && arr.indexOf(item) === index);

  for (const query of candidates) {
    try {
      const response = await withTimeout(
        fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query)}`,
        ),
        LOOKUP_MS,
      );
      if (!response.ok) continue;
      const data = await response.json();
      const audioUrl = (data || [])
        .flatMap((entry) => entry.phonetics || [])
        .map((item) => item.audio)
        .find((src) => typeof src === "string" && src.trim());
      if (audioUrl) return audioUrl;
    } catch {
      // next
    }
  }
  return null;
};

const tryRemoteSources = async (phrase, token) => {
  const cacheKey = keyFor(phrase);
  if (audioUrlCache.has(cacheKey)) {
    try {
      await playUrl(audioUrlCache.get(cacheKey), token);
      return true;
    } catch {
      audioUrlCache.delete(cacheKey);
    }
  }

  for (const url of remoteCandidates(phrase)) {
    if (token !== speakToken) return false;
    try {
      await playUrl(url, token);
      audioUrlCache.set(cacheKey, url);
      return true;
    } catch {
      // try next source
    }
  }

  if (token !== speakToken) return false;

  try {
    const dictionaryUrl = await fetchDictionaryAudioUrl(phrase);
    if (dictionaryUrl && token === speakToken) {
      await playUrl(dictionaryUrl, token);
      audioUrlCache.set(cacheKey, dictionaryUrl);
      return true;
    }
  } catch {
    // fall through
  }

  return false;
};

let audioUnlocked = false;

/**
 * Call from the first click/tap so mobile browsers allow later audio playback.
 */
export const unlockAudio = () => {
  if (audioUnlocked) return;
  audioUnlocked = true;

  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) {
      const ctx = new Ctx();
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.0001;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(0);
      oscillator.stop(0.01);
      window.setTimeout(() => {
        ctx.close().catch(() => {});
      }, 50);
    }
  } catch {
    // ignore
  }

  if (window.speechSynthesis) {
    loadVoices();
    try {
      const warm = new SpeechSynthesisUtterance(" ");
      warm.volume = 0;
      window.speechSynthesis.speak(warm);
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
};

export const speakWord = async (text) => {
  const phrase = normalizePhrase(text);
  if (!phrase) return;

  unlockAudio();

  const token = ++speakToken;
  clearCurrentAudio();
  if (window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }

  try {
    if (await tryRemoteSources(phrase, token)) return;
  } catch (error) {
    console.warn("Remote pronunciation failed", error);
  }

  if (token !== speakToken) return;

  const spoke = await speakWithSpeechSynthesis(phrase, token);
  if (spoke || token !== speakToken) return;

  // Quiet, non-technical fallback — never mention speech-dispatcher / Linux.
  showSpeakFeedback("Couldn't play audio. Check your volume and try again.");
};
