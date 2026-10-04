import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Languages,
  Sparkles,
  RotateCcw,
  Send,
  Stethoscope,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { speechService, AudioAnalysisData } from '../services/speechService';
import { AudioWaveform } from './AudioWaveform';
import { LanguageCode } from '@shared/types';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: LanguageCode;
  onSwitchLanguage: (lang: LanguageCode) => void;
  currentAiQuestion: string;
  onSendPatientVoiceMessage: (text: string) => Promise<void>;
  isAiProcessing: boolean;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  language,
  onSwitchLanguage,
  currentAiQuestion,
  onSendPatientVoiceMessage,
  isAiProcessing,
}) => {
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [finalCommittedTranscript, setFinalCommittedTranscript] = useState<string>('');
  const [audioData, setAudioData] = useState<AudioAnalysisData>({ volume: 0, frequencies: [] });
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const accumulatedTextRef = useRef<string>('');
  const autoSendTimerRef = useRef<any>(null);

  // Read AI question aloud when modal opens or when AI question updates
  useEffect(() => {
    if (isOpen && currentAiQuestion && !isAiProcessing) {
      playDoctorQuestion(currentAiQuestion);
    }
  }, [isOpen, currentAiQuestion]);

  // Clean up when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopAllAudio();
    }
  }, [isOpen]);

  const stopAllAudio = () => {
    speechService.stopListening();
    speechService.stopAudioAnalysis();
    speechService.stopSpeaking();
    setIsMicActive(false);
    setIsAiSpeaking(false);
    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }
  };

  /**
   * Speak Dr. Saarthi's current question and then automatically start listening
   */
  const playDoctorQuestion = (text: string) => {
    stopAllAudio();
    setIsAiSpeaking(true);
    setStatusMessage(language === 'hi' ? 'डॉ. सारथी बोल रहे हैं...' : 'Dr. Saarthi is speaking...');

    speechService.speak(text, language, {
      onStart: () => {
        setIsAiSpeaking(true);
      },
      onEnd: () => {
        setIsAiSpeaking(false);
        // Automatically start listening once Dr. Saarthi finishes speaking
        startListeningToPatient();
      },
      onError: () => {
        setIsAiSpeaking(false);
        startListeningToPatient();
      },
    });
  };

  /**
   * Start microphone listening with real-time speech recognition and audio analysis
   */
  const startListeningToPatient = useCallback(() => {
    if (isAiProcessing) return;

    speechService.stopSpeaking();
    setIsAiSpeaking(false);
    setErrorMessage(null);
    setLiveTranscript('');
    accumulatedTextRef.current = '';
    setStatusMessage(language === 'hi' ? 'आपकी बात सुन रहे हैं (बोलिए)...' : 'Listening to you (Speak now)...');

    // Start Audio Analysis
    speechService.startAudioAnalysis((data) => {
      setAudioData(data);
    });

    // Start Speech Recognition
    speechService.startListening(
      language,
      {
        onStart: () => {
          setIsMicActive(true);
        },
        onInterim: (interim) => {
          setLiveTranscript(interim);
          accumulatedTextRef.current = interim;
        },
        onResult: (transcript, isFinal) => {
          setLiveTranscript(transcript);
          accumulatedTextRef.current = transcript;
          if (isFinal) {
            setFinalCommittedTranscript(transcript);
          }
        },
        onError: (err) => {
          console.warn('[LiveVoiceModal] Speech error:', err);
          setErrorMessage(language === 'hi' ? 'माइक्रोफ़ोन से आवाज़ नहीं मिल पाई। कृपया दोबारा प्रयास करें।' : 'Microphone audio not detected. Please try speaking again.');
          setIsMicActive(false);
          speechService.stopAudioAnalysis();
        },
        onEnd: () => {
          setIsMicActive(false);
          speechService.stopAudioAnalysis();
        },
      },
      { continuous: true }
    );
  }, [isAiProcessing, language]);

  /**
   * Send speech response to Dr. Saarthi AI
   */
  const handleCommitResponse = async (textToSend?: string) => {
    const text = (textToSend || accumulatedTextRef.current || liveTranscript || finalCommittedTranscript).trim();
    if (!text) return;

    stopAllAudio();
    setStatusMessage(language === 'hi' ? 'डॉ. सारथी विचार कर रहे हैं...' : 'Dr. Saarthi is analyzing...');
    setLiveTranscript('');
    accumulatedTextRef.current = '';

    await onSendPatientVoiceMessage(text);
  };

  /**
   * Toggle microphone on/off
   */
  const handleToggleMic = () => {
    if (isMicActive) {
      speechService.stopListening();
      speechService.stopAudioAnalysis();
      setIsMicActive(false);
      setStatusMessage(language === 'hi' ? 'माइक रुका हुआ है (Paused)' : 'Microphone paused');
    } else {
      startListeningToPatient();
    }
  };

  /**
   * Toggle Dr. Saarthi question replay
   */
  const handleReplayQuestion = () => {
    if (currentAiQuestion) {
      playDoctorQuestion(currentAiQuestion);
    }
  };

  if (!isOpen) return null;

  const currentDisplayText = liveTranscript || finalCommittedTranscript;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-obsidian-950/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 text-white flex items-center justify-center shadow-neon-emerald">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {language === 'hi' ? 'डॉ. सारथी लाइव वॉइस परामर्श' : 'Dr. Saarthi Live Voice Intake'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  REAL-TIME AI
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'hi' ? 'स्वाभाविक रूप से बोलें — हिन्दी या English में' : 'Hands-free conversational medical intake'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <button
              type="button"
              onClick={() => onSwitchLanguage(language === 'hi' ? 'en' : 'hi')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-obsidian-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-500 transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-500" />
              <span>{language === 'hi' ? 'हिन्दी (Active)' : 'English (Active)'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                stopAllAudio();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-obsidian-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Content: AI Avatar, Question, and Audio Waveform */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto flex flex-col items-center justify-center text-center space-y-6">
          {/* Animated Glowing AI Doctor Persona Orb */}
          <div className="relative">
            <div
              className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
                isAiSpeaking
                  ? 'bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 shadow-neon-cyan scale-105'
                  : isMicActive
                  ? 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 shadow-neon-emerald scale-100 ring-4 ring-emerald-500/20'
                  : 'bg-slate-200 dark:bg-obsidian-800 shadow-inner'
              }`}
            >
              <Stethoscope className={`w-12 h-12 sm:w-14 sm:h-14 text-white transition-transform ${isAiSpeaking ? 'animate-bounce' : isMicActive ? 'scale-110' : 'opacity-70'}`} />
            </div>

            {/* Pulsing ring waves when active */}
            {(isAiSpeaking || isMicActive) && (
              <>
                <span className={`absolute -inset-3 rounded-full border-2 animate-ping pointer-events-none opacity-40 ${isAiSpeaking ? 'border-cyan-400' : 'border-emerald-400'}`} />
                <span className={`absolute -inset-6 rounded-full border border-dashed animate-spin pointer-events-none opacity-20 ${isAiSpeaking ? 'border-cyan-400' : 'border-emerald-400'}`} style={{ animationDuration: '8s' }} />
              </>
            )}
          </div>

          {/* Current Dr. Saarthi Clinical Question Display */}
          <div className="w-full max-w-xl bg-slate-50 dark:bg-obsidian-850 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 text-left relative shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Dr. Saarthi (Clinical Inquiry)</span>
              </span>
              <button
                type="button"
                onClick={handleReplayQuestion}
                disabled={isAiSpeaking}
                title="Listen to question again"
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors p-1"
              >
                <Volume2 className="w-4 h-4" />
                <span>{language === 'hi' ? 'पुनः सुनें' : 'Replay'}</span>
              </button>
            </div>
            <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
              {currentAiQuestion || 'Hello! What symptoms bring you in today?'}
            </p>
          </div>

          {/* Dynamic Audio Waveform Spectrum */}
          <div className="w-full max-w-md">
            <AudioWaveform
              isActive={isMicActive || isAiSpeaking}
              variant="expanded"
              volume={isAiSpeaking ? 65 : audioData.volume}
              frequencies={isAiSpeaking ? [40, 60, 80, 70, 85, 60, 50, 40] : audioData.frequencies}
              isSpeakingAi={isAiSpeaking}
            />
          </div>

          {/* Live Streaming Speech Transcript Subtitle */}
          <div className="w-full max-w-xl min-h-[70px] bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 flex flex-col justify-center shadow-lg">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isMicActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                <span>{statusMessage}</span>
              </span>
              {currentDisplayText && (
                <span className="text-emerald-400 font-mono text-[10px]">Real-time STT</span>
              )}
            </div>
            <p className="text-sm sm:text-base font-medium text-emerald-200 italic">
              {currentDisplayText ? `"${currentDisplayText}"` : (
                <span className="text-slate-500 font-normal not-italic">
                  {isMicActive
                    ? (language === 'hi' ? 'अपनी तकलीफ खुलकर बताएं...' : 'Speak your symptoms clearly...')
                    : (language === 'hi' ? 'माइक चालू करने के लिए नीचे बटन दबाएं' : 'Click the microphone below to start speaking')}
                </span>
              )}
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="w-full max-w-xl p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 rounded-2xl text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Voice Demo Helper Chips (for testing / judges) */}
          <div className="w-full max-w-xl pt-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 px-1">
              <span>💡 {language === 'hi' ? 'त्वरित टेस्ट वाक्य (Quick Samples):' : 'Quick Voice Samples (for fast testing):'}</span>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 text-xs">
              {(language === 'hi'
                ? [
                    'मुझे 3 दिन से पेट दर्द है',
                    'मध्यम है, रात को ज्यादा होता है',
                    'उल्टी और जी मिचलाना भी है',
                    'बीपी की गोली लेता हूँ',
                  ]
                : [
                    'I have stomach pain for 3 days',
                    'It is moderate pain',
                    'Nausea and vomiting present',
                    'I take BP medications',
                  ]
              ).map((chipText, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setLiveTranscript(chipText);
                    accumulatedTextRef.current = chipText;
                    handleCommitResponse(chipText);
                  }}
                  className="px-3 py-1 rounded-xl bg-white dark:bg-obsidian-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-300 text-xs transition-all shadow-2xs hover:scale-105"
                >
                  "{chipText}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Bottom Controls */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-obsidian-950/80 backdrop-blur-md flex items-center justify-between gap-3">
          {/* Secondary Action: Replay Question */}
          <button
            type="button"
            onClick={handleReplayQuestion}
            disabled={isAiSpeaking}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-obsidian-800 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{language === 'hi' ? 'सवाल दोहराएं' : 'Replay Question'}</span>
          </button>

          {/* Primary Microphone Trigger */}
          <button
            type="button"
            onClick={handleToggleMic}
            disabled={isAiSpeaking || isAiProcessing}
            className={`px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2.5 transition-all shadow-lg ${
              isMicActive
                ? 'bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-neon-rose ring-4 ring-rose-500/30'
                : 'bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white shadow-neon-emerald'
            } ${isAiSpeaking || isAiProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
          >
            {isMicActive ? (
              <>
                <MicOff className="w-5 h-5 animate-pulse" />
                <span>{language === 'hi' ? 'माइक बंद करें (Mute)' : 'Stop Listening'}</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <span>{language === 'hi' ? 'बोलना शुरू करें' : 'Start Speaking'}</span>
              </>
            )}
          </button>

          {/* Send Response Button */}
          <button
            type="button"
            onClick={() => handleCommitResponse()}
            disabled={!currentDisplayText.trim() || isAiProcessing}
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-md shadow-emerald-600/25"
          >
            <span>{language === 'hi' ? 'भेजें (Send)' : 'Send Response'}</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
