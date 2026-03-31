import { useEffect, useRef, useState } from 'preact/hooks';
import './styles.scss';

type AudioMessageProps = {
    src: string;
    durationHint?: string;
    messageTime?: string;
    status?: 'sent' | 'received' | 'read' | '';
    avatarSrc?: string;
    avatarAlt?: string;
    accentColor?: string;
};

// Static waveform shape — always rendered as-is; only coloring changes during playback
const NUMBER_OF_BARS = 42;
const FALLBACK_WAVEFORM = Array.from({ length: NUMBER_OF_BARS }, (_, i) => {
    const seed = Math.sin((i + 1) * 9.301) * 43758.5453;
    const base = seed - Math.floor(seed);
    const bell = Math.sin((i / NUMBER_OF_BARS) * Math.PI);
    return 0.2 + base * 0.5 + bell * 0.3;
});

const formatTime = (seconds?: number) => {
    if (seconds === undefined || Number.isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const SPEED_OPTIONS = [1, 1.5, 2] as const;

export default function AudioMessage({
    src,
    durationHint,
    messageTime,
    status = '',
    avatarSrc,
    avatarAlt = 'Avatar',
    accentColor = '#53bdeb',
}: AudioMessageProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const animRef = useRef<number>();
    const waveformRef = useRef<HTMLDivElement>(null);
    const pointerActive = useRef(false);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState<number | undefined>(undefined);
    const [speedIndex, setSpeedIndex] = useState(0);

    const progress = duration ? Math.min(currentTime / duration, 1) : 0;
    const speed = SPEED_OPTIONS[speedIndex];

    useEffect(() => {
        const audio = new Audio(src);
        audio.preload = 'auto';
        audioRef.current = audio;

        const updateTime = () => setCurrentTime(audio.currentTime);

        audio.onloadedmetadata = () => setDuration(audio.duration);
        audio.onplay = () => {
            setIsPlaying(true);
            const tick = () => { updateTime(); animRef.current = requestAnimationFrame(tick); };
            animRef.current = requestAnimationFrame(tick);
        };
        audio.onpause = () => {
            setIsPlaying(false);
            if (animRef.current) cancelAnimationFrame(animRef.current);
            updateTime();
        };
        audio.onended = () => {
            audio.currentTime = 0;
        };

        return () => {
            audio.pause();
            audio.src = '';
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [src]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) audio.pause();
        else audio.play().catch(() => {});
    };

    const cycleSpeed = () => {
        const next = (speedIndex + 1) % SPEED_OPTIONS.length;
        setSpeedIndex(next);
        if (audioRef.current) audioRef.current.playbackRate = SPEED_OPTIONS[next];
    };

    const handlePointer = (e: PointerEvent) => {
        if (!audioRef.current || !duration || !waveformRef.current) return;
        
        if (e.type === 'pointerdown') {
            pointerActive.current = true;
            try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
        } else if (e.type === 'pointerup' || e.type === 'pointercancel') {
            pointerActive.current = false;
        }

        if (e.type === 'pointerdown' || pointerActive.current) {
            const r = waveformRef.current.getBoundingClientRect();
            audioRef.current.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * duration;
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const formattedDuration = duration ? formatTime(duration) : (durationHint ?? '0:00');
    const displayTime = (isPlaying || currentTime > 0) ? formatTime(currentTime) : formattedDuration;
    const dotBarIndex = Math.round(progress * (NUMBER_OF_BARS - 1));

    return (
        <div class="vn" style={{ '--accent': accentColor } as Record<string, string>}>

            {/* ── Avatar or Speed Badge — col 1, row 1 ─────────────── */}
            {!isPlaying && avatarSrc ? (
                <div class="vn__avatar">
                    <img src={avatarSrc} alt={avatarAlt} loading="lazy" decoding="async" />
                    <span class="vn__avatar-mic" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 15c1.66 0 3-1.34 3-3V6a3 3 0 0 0-6 0v6c0 1.66 1.34 3 3 3zm5-3a1 1 0 0 0-2 0 3 3 0 0 1-6 0 1 1 0 0 0-2 0 5.002 5.002 0 0 0 4 4.9V19h-2a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.1A5.002 5.002 0 0 0 17 12z"/></svg>
                    </span>
                </div>
            ) : isPlaying ? (
                <div class="vn__speed-wrapper">
                    <button class="vn__speed" type="button" onClick={cycleSpeed}>
                        {speed}×
                    </button>
                </div>
            ) : null}

            {/* ── Player area — col 2, row 1 ───────── */}
            <div class="vn__player">
                {/* Play / Pause */}
                <button
                    class={`vn__play ${isPlaying ? 'is-playing' : ''}`}
                    type="button"
                    onClick={togglePlay}
                    aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                >
                    {isPlaying
                        ? <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                        : <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    }
                </button>

                {/* Waveform */}
                <div class="vn__waveform-area">
                    <div
                        class="vn__waveform"
                        ref={waveformRef}
                        onPointerDown={handlePointer}
                        onPointerMove={handlePointer}
                        onPointerUp={handlePointer}
                        onPointerCancel={handlePointer}
                        role="slider"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(progress * 100)}
                        aria-label="Progreso"
                        tabIndex={0}
                    >
                        {FALLBACK_WAVEFORM.map((h, i) => (
                            <div key={i} class="vn__bar-cell">
                                {i === dotBarIndex
                                    ? <span class="vn__dot" aria-hidden="true" />
                                    : <span
                                        class={`vn__bar ${i <= dotBarIndex ? 'is-active' : ''}`}
                                        style={{ height: `${Math.max(h * 100, 14)}%` }}
                                      />
                                }
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Footer — col 2, row 2 ─────────────── */}
            <div class="vn__footer">
                <span class="vn__duration">{displayTime}</span>
                {(messageTime || status) && (
                    <div class="vn__meta">
                        {messageTime && <span class="vn__time">{messageTime}</span>}
                        {status && (
                            <span class={`vn__status vn__status--${status}`}>
                                {status === 'sent' && (
                                    <svg viewBox="0 0 12 11" height="11" width="16" fill="none"><path d="M11.1549 0.652832C11.0745 0.585124 10.9729 0.55127 10.8502 0.55127C10.7021 0.55127 10.5751 0.610514 10.4693 0.729004L4.28038 8.36523L1.87461 6.09277C1.8323 6.04622 1.78151 6.01025 1.72227 5.98486C1.66303 5.95947 1.60166 5.94678 1.53819 5.94678C1.407 5.94678 1.29275 5.99544 1.19541 6.09277L0.884379 6.40381C0.79128 6.49268 0.744731 6.60482 0.744731 6.74023C0.744731 6.87565 0.79128 6.98991 0.884379 7.08301L3.88047 10.0791C4.02859 10.2145 4.19574 10.2822 4.38194 10.2822C4.48773 10.2822 4.58929 10.259 4.68663 10.2124C4.78396 10.1659 4.86436 10.1003 4.92784 10.0156L11.5738 1.59863C11.6458 1.5013 11.6817 1.40186 11.6817 1.30029C11.6817 1.14372 11.6183 1.01888 11.4913 0.925781L11.1549 0.652832Z" fill="currentcolor"/></svg>
                                )}
                                {(status === 'received' || status === 'read') && (
                                    <svg viewBox="0 0 16 11" height="11" width="16" fill="none"><path d="M11.0714 0.652832C10.991 0.585124 10.8894 0.55127 10.7667 0.55127C10.6186 0.55127 10.4916 0.610514 10.3858 0.729004L4.19688 8.36523L1.79112 6.09277C1.7488 6.04622 1.69802 6.01025 1.63877 5.98486C1.57953 5.95947 1.51817 5.94678 1.45469 5.94678C1.32351 5.94678 1.20925 5.99544 1.11192 6.09277L0.800883 6.40381C0.707784 6.49268 0.661235 6.60482 0.661235 6.74023C0.661235 6.87565 0.707784 6.98991 0.800883 7.08301L3.79698 10.0791C3.94509 10.2145 4.11224 10.2822 4.29844 10.2822C4.40424 10.2822 4.5058 10.259 4.60313 10.2124C4.70046 10.1659 4.78086 10.1003 4.84434 10.0156L11.4903 1.59863C11.5623 1.5013 11.5982 1.40186 11.5982 1.30029C11.5982 1.14372 11.5348 1.01888 11.4078 0.925781L11.0714 0.652832ZM8.6212 8.32715C8.43077 8.20866 8.2488 8.09017 8.0753 7.97168C7.99489 7.89128 7.8891 7.85107 7.75791 7.85107C7.6098 7.85107 7.4892 7.90397 7.3961 8.00977L7.10411 8.33984C7.01947 8.43717 6.97715 8.54508 6.97715 8.66357C6.97715 8.79476 7.0237 8.90902 7.1168 9.00635L8.1959 10.0791C8.33132 10.2145 8.49636 10.2822 8.69102 10.2822C8.79681 10.2822 8.89838 10.259 8.99571 10.2124C9.09304 10.1659 9.17556 10.1003 9.24327 10.0156L15.8639 1.62402C15.9358 1.53939 15.9718 1.43994 15.9718 1.32568C15.9718 1.1818 15.9125 1.05697 15.794 0.951172L15.4386 0.678223C15.3582 0.610514 15.2587 0.57666 15.1402 0.57666C14.9964 0.57666 14.8715 0.635905 14.7657 0.754395L8.6212 8.32715Z" fill="currentColor"/></svg>
                                )}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
