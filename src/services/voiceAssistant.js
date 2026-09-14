/**
 * Real-Time Driving Voice Assistant
 * Integrates Web Speech API (SpeechSynthesis) for calm, non-intrusive safety notifications
 * and Web Speech Recognition for interactive driver voice commands.
 */
class VoiceAssistantService {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.isMuted = true; // Default to muted for calm, peaceful startup
    this.lastSpokenText = '';
    this.lastSpokenTime = 0;
    this.currentUtterance = null;
    this.recognition = null;
    this.isListening = false;
    this.isSpeaking = false;
    this.onCommandCallback = null;
    this.onStateChangeCallback = null;
    this.speechRate = 0.96;
    this.speechVolume = 0.55;
    this.languageMode = 'hinglish'; // 'en' or 'hinglish' (Bilingual Indian Copilot)

    this._initSpeechRecognition();
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted && this.synth) {
      this.synth.cancel();
      this._setSpeakingState(false);
    }
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  setVolume(vol) {
    this.speechVolume = Math.max(0, Math.min(1, Number(vol) || 0.55));
  }

  setRate(rate) {
    this.speechRate = Math.max(0.7, Math.min(1.3, Number(rate) || 0.96));
  }

  setLanguageMode(mode) {
    this.languageMode = mode === 'en' ? 'en' : 'hinglish';
  }

  _setSpeakingState(speaking) {
    this.isSpeaking = speaking;
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({ isSpeaking: this.isSpeaking, isListening: this.isListening });
    }
  }

  _setListeningState(listening) {
    this.isListening = listening;
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({ isSpeaking: this.isSpeaking, isListening: this.isListening });
    }
  }

  _translateToHinglish(text) {
    const t = text.toLowerCase();
    if (t.includes('brake firmly') || t.includes('collision') || t.includes('slow down immediately')) {
      return 'Savdhaan! Aage gaadi bohot paas hai, kripya brake lagayein aur doori banayein!';
    }
    if (t.includes('cattle') || t.includes('cow')) {
      return 'Dhyan dein! Sadak par aage gaay hai! Kripya gaadi dheemi karein!';
    }
    if (t.includes('pothole')) {
      return 'Savdhaan! Aage bada gaddha hai, kripya steering sambhaalein!';
    }
    if (t.includes('eyes closed') || t.includes('wake up') || t.includes('drowsy')) {
      return 'Jaagte rahiye! Aapki aankhein band ho rahi hain, kripya gaadi rok kar aaraam karein!';
    }
    if (t.includes('phone')) {
      return 'Kripya gaadi chalate samay mobile phone ka upayog na karein!';
    }
    if (t.includes('overspeeding') || t.includes('speed limit')) {
      return 'Aapki raftaar tezz hai. Kripya niyamit speed limit ka paalan karein.';
    }
    if (t.includes('lane departure') || t.includes('drifting')) {
      return 'Gaadi lane se bhatak rahi hai. Kripya lane ke beech mein chalein.';
    }
    if (t.includes('arrived at your destination')) {
      return 'Aap apni manzil par pahunch gaye hain. Suraksha AI yatra samapt.';
    }
    return text;
  }

  /**
   * Speak a calm, safety-critical directive.
   * Strict anti-annoyance filters prevent repetitive spamming.
   */
  speakAlert(text, urgency = 'NORMAL') {
    if (this.isMuted || !this.synth || !text) return;

    const now = Date.now();
    const isCritical = urgency === 'CRITICAL' || urgency === 'IMMINENT';

    // Global cooldown: Do NOT speak anything if we spoke within the last 7 seconds
    if (!isCritical && now - this.lastSpokenTime < 7000) {
      return;
    }

    // Duplicate phrase cooldown
    const repeatThrottleWindow = isCritical ? 10000 : 22000;
    if (this.lastSpokenText === text && now - this.lastSpokenTime < repeatThrottleWindow) {
      return;
    }

    if (this.synth.speaking) {
      if (isCritical) {
        this.synth.cancel();
      } else {
        return;
      }
    }

    const spokenText = this.languageMode === 'hinglish' ? this._translateToHinglish(text) : text;
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.rate = this.speechRate;
    utterance.pitch = 1.0;
    utterance.volume = this.speechVolume;

    const voices = this.synth.getVoices();
    const preferredVoice =
      voices.find(v => v.lang === 'hi-IN') ||
      voices.find(v => v.lang === 'en-IN') ||
      voices.find(v => v.lang.startsWith('en')) ||
      voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => this._setSpeakingState(true);
    utterance.onend = () => this._setSpeakingState(false);
    utterance.onerror = () => this._setSpeakingState(false);

    this.lastSpokenText = text;
    this.lastSpokenTime = now;
    this.currentUtterance = utterance;

    this.synth.speak(utterance);
  }

  _initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-IN';

      this.recognition.onresult = (event) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const command = lastResult[0].transcript.trim().toLowerCase();
          if (this.onCommandCallback) {
            this.onCommandCallback(command);
          }
        }
      };

      this.recognition.onend = () => {
        this._setListeningState(false);
      };

      this.recognition.onerror = (err) => {
        console.warn('Speech Recognition error:', err.error);
        this._setListeningState(false);
      };
    }
  }

  startListening(callback) {
    this.onCommandCallback = callback;
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
        this._setListeningState(true);
      } catch (e) {
        console.warn('Could not start recognition:', e);
      }
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this._setListeningState(false);
    }
  }
}

export const voiceAssistant = new VoiceAssistantService();
