/**
 * Sound Effects Utility
 * Plays sound effects for chat interactions using audio files
 * 
 * Place your sound effect files in the /public/sounds/ directory:
 * - message-sent.mp3 (or .wav, .ogg)
 * - message-received.mp3 (or .wav, .ogg)
 * 
 * If audio files are not found, falls back to programmatic sounds
 */

// Audio file paths (relative to public directory)
// Try multiple formats for better compatibility
const MESSAGE_SENT_SOUNDS = [
  '/sounds/message-sent.mp3',
  '/sounds/message-sent.wav',
  '/sounds/message-sent.ogg',
];

const MESSAGE_RECEIVED_SOUNDS = [
  '/sounds/message-received.mp3',
  '/sounds/message-received.wav',
  '/sounds/message-received.ogg',
];

// Cache for audio elements to avoid reloading
let sentAudioCache: HTMLAudioElement | null = null;
let receivedAudioCache: HTMLAudioElement | null = null;

/**
 * Play a sound effect from an audio file
 * Tries multiple file formats and sources
 */
function playAudioFile(sources: string[], cache: { current: HTMLAudioElement | null }): void {
  try {
    // Try to use cached audio element
    let audio = cache.current;
    
    if (!audio) {
      // Create new audio element with first source
      audio = new Audio(sources[0]);
      audio.volume = 0.5; // Set volume to 50%
      audio.preload = 'auto';
      
      // Add error handler to try next format if current one fails
      let currentSourceIndex = 0;
      audio.addEventListener('error', () => {
        // Try next format if available
        if (currentSourceIndex < sources.length - 1 && audio) {
          currentSourceIndex++;
          audio.src = sources[currentSourceIndex];
          audio.load();
        }
      });
      
      cache.current = audio;
    }
    
    // Reset to beginning and play
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Silently fail if audio cannot play (e.g., user hasn't interacted with page)
        // Don't throw - let the fallback handle it
      });
    }
  } catch (error) {
    // Silently catch any errors - fallback will be called
    console.debug('Error playing audio file:', error);
  }
}

/**
 * Fallback: Generate a programmatic sound effect for message sent
 */
function playMessageSentSoundFallback(): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Create a pleasant "pop" sound for sent messages
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.type = 'sine';
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (error) {
    console.debug('Could not play message sent sound fallback:', error);
  }
}

/**
 * Fallback: Generate a programmatic sound effect for message received
 */
function playMessageReceivedSoundFallback(): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a pleasant "ding" sound for received messages
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Two-tone chime for a pleasant notification sound
    oscillator1.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator2.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator1.type = 'sine';
    oscillator2.type = 'sine';
    
    oscillator1.start(audioContext.currentTime);
    oscillator2.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.3);
    oscillator2.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.debug('Could not play message received sound fallback:', error);
  }
}

/**
 * Play a sound effect for message sent
 * Tries to use audio file first, falls back to programmatic sound
 * Never throws errors - completely safe
 */
export function playMessageSentSound(): void {
  try {
    // Try audio file first
    playAudioFile(MESSAGE_SENT_SOUNDS, { current: sentAudioCache });
  } catch {
    // Ignore errors
  }
  
  // Always use fallback as backup (it's lightweight)
  try {
    playMessageSentSoundFallback();
  } catch {
    // Ignore fallback errors too - sounds are optional
  }
}

/**
 * Play a sound effect for message received
 * Tries to use audio file first, falls back to programmatic sound
 * Never throws errors - completely safe
 */
export function playMessageReceivedSound(): void {
  try {
    // Try audio file first
    playAudioFile(MESSAGE_RECEIVED_SOUNDS, { current: receivedAudioCache });
  } catch {
    // Ignore errors
  }
  
  // Always use fallback as backup (it's lightweight)
  try {
    playMessageReceivedSoundFallback();
  } catch {
    // Ignore fallback errors too - sounds are optional
  }
}

