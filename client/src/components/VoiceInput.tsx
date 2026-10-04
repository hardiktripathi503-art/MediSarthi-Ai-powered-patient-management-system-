import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, RotateCcw, AlertCircle, Sparkles, Check } from 'lucide-react';
import { speechService, AudioAnalysisData } from '../services/speechService';
import { AudioWaveform } from './AudioWaveform';
import { LanguageCode } from '@shared/types';

interface VoiceInputProps {
  language: LanguageCode;
  onTranscript: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  disabled?: boolean;
  placeholderText?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  language,
  onTranscript,
  onInterimTranscript,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [audioData, setAudioData] = useState<AudioAnalysisData>({ volume: 0, frequencies: [] });

  const accumulatedTranscriptRef = useRef<string>('');

  useEffect(() => {
    setIsSupported(speechService.isSupported());
    return () => {
      speechService.stopListening();
      speechService.stopAudioAnalysis();
    };
  }, []);

  const handleStart = useCallback(() => {
    if (disabled) return;
    setErrorMsg(null);
    setLiveTranscript('');
    accumulatedTranscriptRef.current = '';

    // 1. Start Web Audio API volume and waveform analysis
    speechService.startAudioAnalysis((data) => {
      setAudioData(data);
    });

    // 2. Start Speech Recognition with real-time interim stream
    speechService.startListening(
      language,
      {
        onStart: () => {
          setIsRecording(true);
        },
        onInterim: (interim) => {
          setLiveTranscript(interim);
          if (onInterimTranscript) {
            onInterimTranscript(interim);
          }
        },
        onResult: (transcript, isFinal) => {
          setLiveTranscript(transcript);
          accumulatedTranscriptRef.current = transcript;
          if (onInterimTranscript) {
            onInterimTranscript(transcript);
          }
          if (isFinal) {
            onTranscript(transcript);
          }
        },
        onError: (err) => {
          console.warn('[VoiceInput] Speech error:', err);
          setErrorMsg('Microphone unavailable or permission denied. You can type or use sample chips.');
          setIsRecording(false);
          speechService.stopAudioAnalysis();
        },
        onEnd: () => {
          setIsRecording(false);
          speechService.stopAudioAnalysis();
          // If transcript was captured before stopping, deliver it
          if (accumulatedTranscriptRef.current) {
            onTranscript(accumulatedTranscriptRef.current);
          }
        },
      },
      { continuous: false }
    );
  }, [disabled, language, onInterimTranscript, onTranscript]);

  const handleStop = useCallback(() => {
    speechService.stopListening();
    speechService.stopAudioAnalysis();
    setIsRecording(false);
    if (accumulatedTranscriptRef.current) {
      onTranscript(accumulatedTranscriptRef.current);
    }
  }, [onTranscript]);

  const handleRetry = useCallback(() => {
    setLiveTranscript('');
    accumulatedTranscriptRef.current = '';
    setErrorMsg(null);
    handleStart();
  }, [handleStart]);

  return (
    <div className="relative inline-flex items-center gap-1.5">
      {/* Real-time Inline Audio Waveform (Visible while recording) */}
      {isRecording && (
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900/90 text-white border border-emerald-500/40 shadow-md">
          <AudioWaveform
            isActive={isRecording}
            variant="compact"
            volume={audioData.volume}
            frequencies={audioData.frequencies}
          />
          <span className="text-[10px] font-mono text-emerald-400 font-bold ml-1">
            {language === 'hi' ? 'बोलिए...' : 'Listening...'}
          </span>
        </div>
      )}

      {/* Main Microphone Button */}
      <div className="relative flex items-center">
        <button
          type="button"
          onClick={isRecording ? handleStop : handleStart}
          disabled={disabled}
          title={isRecording ? 'Stop Recording and Send' : 'Click to Speak (Voice Recognition)'}
          className={`relative p-3 rounded-2xl transition-all duration-300 flex items-center justify-center shadow-lg ${
            isRecording
              ? 'bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-neon-rose ring-4 ring-rose-500/30 scale-105'
              : 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white shadow-neon-emerald hover:scale-105'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isRecording ? (
            <MicOff className="w-5 h-5 animate-pulse" />
          ) : (
            <Mic className="w-5 h-5" />
          )}

          {/* Pulsing ring indicator */}
          {isRecording && (
            <span className="absolute -inset-1.5 rounded-2xl border-2 border-rose-500 animate-ping opacity-75 pointer-events-none" />
          )}
        </button>

        {/* Action Controls when Recording */}
        {isRecording && (
          <div className="flex items-center gap-1 ml-1.5">
            {/* Retry Button */}
            <button
              type="button"
              onClick={handleRetry}
              title="Clear & Restart Voice"
              className="p-2 rounded-xl bg-slate-100 dark:bg-obsidian-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-obsidian-700 transition-colors shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            {/* Commit / Done Button */}
            <button
              type="button"
              onClick={handleStop}
              title="Finish Speaking"
              className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Real-time Streaming Transcript Popup Bubble */}
      {isRecording && liveTranscript && (
        <div className="absolute -top-14 left-0 bg-slate-950/95 text-white px-3.5 py-2 rounded-2xl text-xs font-medium flex items-center gap-2 shadow-2xl border border-emerald-500/50 backdrop-blur-md whitespace-nowrap z-40 animate-fade-in max-w-xs sm:max-w-md truncate">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-spin" />
          <span className="text-emerald-300 italic truncate font-sans">
            "{liveTranscript}"
          </span>
        </div>
      )}

      {/* Error state tooltip */}
      {errorMsg && (
        <div className="absolute top-14 left-0 right-0 w-64 bg-rose-50 dark:bg-rose-950/90 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-[11px] p-2.5 rounded-xl shadow-xl flex items-center gap-2 z-40 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">{errorMsg}</p>
          </div>
        </div>
      )}
    </div>
  );
};

