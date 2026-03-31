import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import './styles.scss';

type AudioMessageProps = {
    src: string;
    label?: string;
    durationHint?: string;
    messageTime?: string;
    status?: 'sent' | 'received' | 'read' | '';
    avatarSrc?: string;
    avatarAlt?: string;
    accentColor?: string;
};

type Waveform = number[];

const NUMBER_OF_BARS = 48;

const FALLBACK_WAVEFORM: Waveform = Array.from({ length: NUMBER_OF_BARS }, (_, index) => {
    const seed = Math.sin((index + 1) * 12.9898) * 43758.5453;
    return 0.35 + (seed - Math.floor(seed)) * 0.45;
});

const formatTime = (seconds?: number) => {
    if (seconds === undefined || Number.isNaN(seconds)) {
        return '--:--';
    }

    const wholeSeconds = Math.floor(seconds);
    const mins = Math.floor(wholeSeconds / 60);
    const secs = wholeSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function AudioMessage({
    src,
    label,
    durationHint,
    messageTime,
    status = '',
    avatarSrc,
    avatarAlt = 'Avatar',
    accentColor = '#53bdeb',
}: AudioMessageProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const animationRef = useRef<number>();
    const waveformRef = useRef<HTMLDivElement>(null);
    const pointerActiveRef = useRef(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const analyserDataRef = useRef<Uint8Array | null>(null);
    const hasConnectedAudioRef = useRef(false);
    const frameCounterRef = useRef(0);

    const [isReady, setIsReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState<number | undefined>(undefined);
    const [waveform, setWaveform] = useState<Waveform>(FALLBACK_WAVEFORM);
    const [waveformError, setWaveformError] = useState(false);

    const displayWaveform = waveform;
    const progress = duration ? Math.min(currentTime / duration, 1) : 0;
    const rootStyle = useMemo(() => ({ '--audio-accent': accentColor } as Record<string, string>), [accentColor]);

    useEffect(() => {
        const audio = new Audio(src);
        audio.crossOrigin = 'anonymous';
        audio.preload = 'auto';
        audioRef.current = audio;

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
            setIsReady(true);
        };

        const handlePlay = () => {
            setIsPlaying(true);
            if (animationRef.current !== undefined) {
                cancelAnimationFrame(animationRef.current);
            }
            const step = () => {
                updateWaveform();
                setCurrentTime(audio.currentTime);
                animationRef.current = requestAnimationFrame(step);
            };
            animationRef.current = requestAnimationFrame(step);
        };

        const handlePause = () => {
            setIsPlaying(false);
            if (animationRef.current !== undefined) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = undefined;
            }
            setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            audio.currentTime = 0;
        };

        const handleError = () => {
            setIsReady(false);
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        return () => {
            audio.pause();
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
            if (animationRef.current !== undefined) {
                cancelAnimationFrame(animationRef.current);
            }
            disconnectAnalyser();
            audioRef.current = null;
        };
    }, [src]);

    const setupAnalyser = async () => {
        if (hasConnectedAudioRef.current) {
            if (audioContextRef.current?.state === 'suspended') {
                try {
                    await audioContextRef.current.resume();
                } catch (error) {
                    console.warn('[AudioMessage] Unable to resume AudioContext', error);
                }
            }
            return;
        }

        if (!audioRef.current || typeof window === 'undefined') {
            return;
        }

        const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextCtor) {
            setWaveformError(true);
            return;
        }

        try {
            const context = audioContextRef.current ?? new AudioContextCtor();
            if (context.state === 'suspended') {
                await context.resume();
            }
            audioContextRef.current = context;

            const source = context.createMediaElementSource(audioRef.current);
            const analyser = context.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.7;

            source.connect(analyser);
            analyser.connect(context.destination);

            analyserDataRef.current = new Uint8Array(analyser.frequencyBinCount);
            analyserRef.current = analyser;
            mediaSourceRef.current = source;
            hasConnectedAudioRef.current = true;
            setWaveformError(false);
        } catch (error) {
            console.warn('[AudioMessage] Unable to setup analyser', error);
            setWaveformError(true);
        }
    };

    const disconnectAnalyser = () => {
        mediaSourceRef.current?.disconnect();
        mediaSourceRef.current = null;

        analyserRef.current?.disconnect();
        analyserRef.current = null;

        analyserDataRef.current = null;
        hasConnectedAudioRef.current = false;

        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => undefined);
            audioContextRef.current = null;
        }
    };

    const updateWaveform = () => {
        const analyser = analyserRef.current;
        const dataArray = analyserDataRef.current;

        if (!analyser || !dataArray) {
            return;
        }

        analyser.getByteTimeDomainData(dataArray);
        frameCounterRef.current += 1;

        if (frameCounterRef.current % 2 !== 0) {
            return;
        }

        const sampleSize = Math.max(1, Math.floor(dataArray.length / NUMBER_OF_BARS));
        const nextWaveform: Waveform = [];

        for (let bar = 0; bar < NUMBER_OF_BARS; bar++) {
            const start = bar * sampleSize;
            const end = Math.min(start + sampleSize, dataArray.length);
            let max = 0;

            for (let i = start; i < end; i++) {
                const normalized = Math.abs(dataArray[i] - 128) / 128;
                if (normalized > max) {
                    max = normalized;
                }
            }

            nextWaveform.push(Math.min(max * 1.4, 1));
        }

        setWaveform(nextWaveform);
    };

    const togglePlayback = async () => {
        const audio = audioRef.current;
        if (!audio || !isReady) {
            return;
        }

        if (isPlaying) {
            audio.pause();
        } else {
            await setupAnalyser();
            try {
                await audio.play();
            } catch (error) {
                console.warn('[AudioMessage] Unable to play audio', error);
            }
        }
    };

    const seekTo = (ratio: number) => {
        const audio = audioRef.current;
        if (!audio || !duration) return;
        const clamped = Math.max(0, Math.min(1, ratio));
        audio.currentTime = clamped * duration;
        setCurrentTime(audio.currentTime);
    };

    const handlePointerSeek = (clientX: number) => {
        const container = waveformRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const ratio = (clientX - rect.left) / rect.width;
        seekTo(ratio);
    };

    const onPointerDown = (event: PointerEvent) => {
        event.preventDefault();
        pointerActiveRef.current = true;
        const target = event.currentTarget as HTMLElement;
        if (target && target.setPointerCapture) {
            try {
                target.setPointerCapture(event.pointerId);
            } catch {
                // Ignore if capturing fails (e.g., Safari)
            }
        }
        handlePointerSeek(event.clientX);
    };

    const onPointerMove = (event: PointerEvent) => {
        if (!pointerActiveRef.current) return;
        handlePointerSeek(event.clientX);
    };

    const onPointerUp = (event: PointerEvent) => {
        pointerActiveRef.current = false;
        const target = event.currentTarget as HTMLElement;
        if (target && target.releasePointerCapture) {
            try {
                target.releasePointerCapture(event.pointerId);
            } catch {
                // Ignore if releasing fails
            }
        }
    };

    const formattedDuration = duration ? formatTime(duration) : (durationHint ?? '--:--');
    const ariaPlayingLabel = isPlaying ? 'Pausar nota de voz' : 'Reproducir nota de voz';
    const hasStatus = status === 'sent' || status === 'received' || status === 'read';
    const showMeta = Boolean(messageTime || hasStatus);

    const renderStatusIcon = () => {
        if (status === 'sent') {
            return (
                <svg viewBox="0 0 12 11" height="11" width="16" preserveAspectRatio="xMidYMid meet" fill="none"><title>msg-check</title><path d="M11.1549 0.652832C11.0745 0.585124 10.9729 0.55127 10.8502 0.55127C10.7021 0.55127 10.5751 0.610514 10.4693 0.729004L4.28038 8.36523L1.87461 6.09277C1.8323 6.04622 1.78151 6.01025 1.72227 5.98486C1.66303 5.95947 1.60166 5.94678 1.53819 5.94678C1.407 5.94678 1.29275 5.99544 1.19541 6.09277L0.884379 6.40381C0.79128 6.49268 0.744731 6.60482 0.744731 6.74023C0.744731 6.87565 0.79128 6.98991 0.884379 7.08301L3.88047 10.0791C4.02859 10.2145 4.19574 10.2822 4.38194 10.2822C4.48773 10.2822 4.58929 10.259 4.68663 10.2124C4.78396 10.1659 4.86436 10.1003 4.92784 10.0156L11.5738 1.59863C11.6458 1.5013 11.6817 1.40186 11.6817 1.30029C11.6817 1.14372 11.6183 1.01888 11.4913 0.925781L11.1549 0.652832Z" fill="currentcolor"></path></svg>
            );
        }

        if (status === 'received' || status === 'read') {
            return (
                <svg viewBox="0 0 16 11" height="11" width="16" preserveAspectRatio="xMidYMid meet" fill="none"><title>msg-dblcheck</title><path d="M11.0714 0.652832C10.991 0.585124 10.8894 0.55127 10.7667 0.55127C10.6186 0.55127 10.4916 0.610514 10.3858 0.729004L4.19688 8.36523L1.79112 6.09277C1.7488 6.04622 1.69802 6.01025 1.63877 5.98486C1.57953 5.95947 1.51817 5.94678 1.45469 5.94678C1.32351 5.94678 1.20925 5.99544 1.11192 6.09277L0.800883 6.40381C0.707784 6.49268 0.661235 6.60482 0.661235 6.74023C0.661235 6.87565 0.707784 6.98991 0.800883 7.08301L3.79698 10.0791C3.94509 10.2145 4.11224 10.2822 4.29844 10.2822C4.40424 10.2822 4.5058 10.259 4.60313 10.2124C4.70046 10.1659 4.78086 10.1003 4.84434 10.0156L11.4903 1.59863C11.5623 1.5013 11.5982 1.40186 11.5982 1.30029C11.5982 1.14372 11.5348 1.01888 11.4078 0.925781L11.0714 0.652832ZM8.6212 8.32715C8.43077 8.20866 8.2488 8.09017 8.0753 7.97168C7.99489 7.89128 7.8891 7.85107 7.75791 7.85107C7.6098 7.85107 7.4892 7.90397 7.3961 8.00977L7.10411 8.33984C7.01947 8.43717 6.97715 8.54508 6.97715 8.66357C6.97715 8.79476 7.0237 8.90902 7.1168 9.00635L8.1959 10.0791C8.33132 10.2145 8.49636 10.2822 8.69102 10.2822C8.79681 10.2822 8.89838 10.259 8.99571 10.2124C9.09304 10.1659 9.17556 10.1003 9.24327 10.0156L15.8639 1.62402C15.9358 1.53939 15.9718 1.43994 15.9718 1.32568C15.9718 1.1818 15.9125 1.05697 15.794 0.951172L15.4386 0.678223C15.3582 0.610514 15.2587 0.57666 15.1402 0.57666C14.9964 0.57666 14.8715 0.635905 14.7657 0.754395L8.6212 8.32715Z" fill="currentColor"></path></svg>
            );
        }

        return null;
    };

    return (
        <div class="chat-audio" style={rootStyle}>
            <button
                class={`chat-audio__button ${isPlaying ? 'is-playing' : ''}`}
                type="button"
                onClick={togglePlayback}
                aria-label={ariaPlayingLabel}
            >
                <span class="chat-audio__button-icon" aria-hidden="true">
                    {isPlaying ? (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9 6h2v12H9zm4 0h2v12h-2z"></path></svg>
                    ) : (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>
                    )}
                </span>
            </button>

            <div class="chat-audio__body">
                {label &&
                    <span class="chat-audio__label">{label}</span>
                }

                <div
                    class={`chat-audio__waveform ${waveformError ? 'has-error' : ''}`}
                    ref={waveformRef}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                    role="presentation"
                    data-progress={progress}
                >
                    <div class="chat-audio__progress" style={{ width: `${progress * 100}%` }} aria-hidden="true">
                        <span class="chat-audio__progress-dot" aria-hidden="true"></span>
                    </div>
                    <div class="chat-audio__bars" aria-hidden="true">
                        {displayWaveform.map((height, index) => {
                            const barActive = index / displayWaveform.length <= progress;
                            return (
                                <span
                                    key={index}
                                    class={`chat-audio__bar ${barActive ? 'is-active' : ''}`}
                                    style={{ height: `${Math.max(height * 100, 8)}%` }}
                                ></span>
                            );
                        })}
                    </div>
                </div>

                <div class="chat-audio__footer">
                    <div class="chat-audio__time">
                        <span class="chat-audio__time-current">{formatTime(currentTime)}</span>
                        <span class="chat-audio__time-divider">/</span>
                        <span class="chat-audio__time-duration">{formattedDuration}</span>
                    </div>
                    {showMeta &&
                        <div class="chat-audio__time-meta">
                            {messageTime &&
                                <span class="chat-audio__message-time">{messageTime}</span>
                            }
                            {hasStatus &&
                                <span class={`chat-audio__status chat-audio__status--${status}`}>
                                    {renderStatusIcon()}
                                </span>
                            }
                        </div>
                    }
                </div>
            </div>

            {avatarSrc &&
                <div class="chat-audio__avatar">
                    <img src={avatarSrc} alt={avatarAlt} loading="lazy" decoding="async" />
                    <span class="chat-audio__avatar-mic" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 15c1.66 0 3-1.34 3-3V6a3 3 0 0 0-6 0v6c0 1.66 1.34 3 3 3zm5-3a1 1 0 0 0-2 0 3 3 0 0 1-6 0 1 1 0 0 0-2 0 5.002 5.002 0 0 0 4 4.9V19h-2a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.1A5.002 5.002 0 0 0 17 12z"></path></svg>
                    </span>
                </div>
            }
        </div>
    );
}
