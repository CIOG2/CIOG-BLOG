import { useEffect, useRef, useState, useCallback } from 'preact/hooks';
import type { FunctionComponent } from 'preact';
import './styles.scss';

// ── Types ────────────────────────────────────────────────────
type CallState = 'idle' | 'ringing' | 'connected' | 'ended' | 'dismissed';

interface IncomingCallProps {
    callerName?: string;
    callerLabel?: string;
    callerImage?: string;
    callerImageAlt?: string;
    ringtoneSrc?: string;
    audioSrc?: string;
    callEndedSrc?: string;
    sentinelId?: string;
}

// ── Spectrum constants ───────────────────────────────────────
const BAR_COUNT  = 36;
const BAR_GAP    = 3;
const BAR_RADIUS = 3;
const COLOR_MAIN = '#00a884';
const COLOR_DIM  = 'rgba(0,168,132,0.25)';

// ── Helpers ──────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0');

function drawBar(
    ctx: CanvasRenderingContext2D,
    x: number, barW: number, barH: number, totalH: number,
) {
    const y = (totalH - barH) / 2;
    const r = Math.min(BAR_RADIUS, barW / 2, barH / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + barW - r, y);
    ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
    ctx.lineTo(x + barW, y + barH - r);
    ctx.quadraticCurveTo(x + barW, y + barH, x + barW - r, y + barH);
    ctx.lineTo(x + r, y + barH);
    ctx.quadraticCurveTo(x, y + barH, x, y + barH - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
}

// ── Avatar SVG ───────────────────────────────────────────────
const AvatarPlaceholderSvg = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
    </svg>
);

// ── Phone SVG ────────────────────────────────────────────────
const PhoneSvg = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
    </svg>
);

// ══════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════
const IncomingCall: FunctionComponent<IncomingCallProps> = ({
    callerName     = '+52 667 430 3666',
    callerLabel    = 'Llamada de WhatsApp',
    callerImage,
    callerImageAlt = 'Foto de perfil',
    ringtoneSrc,
    audioSrc,
    callEndedSrc,
    sentinelId     = 'chat-cta',
}) => {
    // ── State ────────────────────────────────────────────────
    const [callState, setCallState]     = useState<CallState>('idle');
    const [timerText, setTimerText]     = useState('00:00');
    const [statusText, setStatusText]   = useState('Llamada entrante…');

    // ── Refs ─────────────────────────────────────────────────
    const ringRef       = useRef<HTMLAudioElement>(null);
    const audioRef      = useRef<HTMLAudioElement>(null);
    const endedAudioRef = useRef<HTMLAudioElement>(null);
    const canvasRef     = useRef<HTMLCanvasElement>(null);
    const overlayRef    = useRef<HTMLDivElement>(null);

    const audioCtxRef   = useRef<AudioContext | null>(null);
    const analyserRef   = useRef<AnalyserNode | null>(null);
    const specFrameRef  = useRef<number>(0);
    const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
    const vibrateRef    = useRef<ReturnType<typeof setInterval> | null>(null);
    const secondsRef    = useRef(0);

    // ── AudioContext (unlocked on first click) ───────────────
    const getAudioCtx = useCallback(() => {
        if (!audioCtxRef.current) {
            const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (Ctor) audioCtxRef.current = new Ctor();
        }
        if (audioCtxRef.current?.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        return audioCtxRef.current;
    }, []);

    // Unlock AudioContext on any click
    useEffect(() => {
        const handler = () => getAudioCtx();
        document.addEventListener('click', handler, { passive: true });
        return () => document.removeEventListener('click', handler);
    }, [getAudioCtx]);

    // ── Vibration ────────────────────────────────────────────
    const startVibration = useCallback(() => {
        if (!('vibrate' in navigator)) return;
        const doVib = () => navigator.vibrate([400, 150, 400, 150, 400]);
        doVib();
        vibrateRef.current = setInterval(doVib, 2600);
    }, []);

    const stopVibration = useCallback(() => {
        if (vibrateRef.current) { clearInterval(vibrateRef.current); vibrateRef.current = null; }
        if ('vibrate' in navigator) navigator.vibrate(0);
    }, []);

    // ── Ringtone ─────────────────────────────────────────────
    const startRing = useCallback(() => {
        const el = ringRef.current;
        if (el) { el.currentTime = 0; el.play().catch(() => {}); }
    }, []);

    const stopRing = useCallback(() => {
        const el = ringRef.current;
        if (el) { el.pause(); el.currentTime = 0; }
    }, []);

    // ── Timer ────────────────────────────────────────────────
    const startTimer = useCallback(() => {
        secondsRef.current = 0;
        setTimerText('00:00');
        timerRef.current = setInterval(() => {
            secondsRef.current++;
            const m = Math.floor(secondsRef.current / 60);
            const s = secondsRef.current % 60;
            setTimerText(`${pad(m)}:${pad(s)}`);
        }, 1000);
    }, []);

    const stopTimer = useCallback(() => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }, []);

    // ── Spectrum ─────────────────────────────────────────────
    const startSpectrum = useCallback(() => {
        const cvs = canvasRef.current;
        if (!cvs) return;

        cvs.style.width  = '100%';
        cvs.style.height = '72px';

        requestAnimationFrame(() => {
            const dpr  = window.devicePixelRatio || 1;
            const rect = cvs.getBoundingClientRect();
            cvs.width  = rect.width  * dpr;
            cvs.height = rect.height * dpr;
            const ctx  = cvs.getContext('2d')!;
            ctx.scale(dpr, dpr);
            const w = rect.width;
            const h = rect.height;
            const barW = (w - BAR_GAP * (BAR_COUNT - 1)) / BAR_COUNT;

            let freqData: Uint8Array<ArrayBuffer> | null = null;
            const analyser = analyserRef.current;
            if (analyser) freqData = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;

            const smooth = new Float32Array(BAR_COUNT).fill(0);
            const SMOOTHING = 0.75;

            const draw = (timestamp: number) => {
                specFrameRef.current = requestAnimationFrame(draw);
                ctx.clearRect(0, 0, w, h);

                const raw = new Float32Array(BAR_COUNT);
                if (analyser && freqData) {
                    analyser.getByteFrequencyData(freqData);
                    for (let i = 0; i < BAR_COUNT; i++) {
                        const idx = Math.floor(i * freqData.length / (BAR_COUNT * 1.5));
                        raw[i] = freqData[idx] / 255;
                    }
                } else {
                    const t = timestamp * 0.001;
                    for (let i = 0; i < BAR_COUNT; i++) {
                        const pos   = i / BAR_COUNT;
                        const wave1 = Math.sin(t * 3.1 + pos * 12) * 0.5 + 0.5;
                        const wave2 = Math.sin(t * 2.3 + pos * 7  + 1.5) * 0.5 + 0.5;
                        const wave3 = Math.sin(t * 5.7 + pos * 20) * 0.25 + 0.25;
                        const env   = Math.exp(-Math.pow((pos - 0.5) * 2.5, 2));
                        raw[i]      = Math.min(1, (wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2) * env * 1.4);
                    }
                }

                for (let i = 0; i < BAR_COUNT; i++) {
                    smooth[i] = smooth[i] * SMOOTHING + raw[i] * (1 - SMOOTHING);
                }

                for (let i = 0; i < BAR_COUNT; i++) {
                    const x    = i * (barW + BAR_GAP);
                    const minH = 4;
                    const barH = Math.max(minH, smooth[i] * h * 0.9);
                    ctx.fillStyle = smooth[i] > 0.08 ? COLOR_MAIN : COLOR_DIM;
                    drawBar(ctx, x, barW, barH, h);
                }
            };
            draw(0);
        });
    }, []);

    const stopSpectrum = useCallback(() => {
        if (specFrameRef.current) {
            cancelAnimationFrame(specFrameRef.current);
            specFrameRef.current = 0;
        }
    }, []);

    // ── Listen for call trigger from ChatModal ─────────────────
    useEffect(() => {
        const handler = () => {
            setCallState('ringing');
        };
        document.addEventListener('trigger-incoming-call', handler, { once: true });
        return () => document.removeEventListener('trigger-incoming-call', handler);
    }, []);

    // ── React to state changes ───────────────────────────────
    // RINGING
    useEffect(() => {
        if (callState !== 'ringing') return;
        startRing();
        startVibration();
        setStatusText('Llamada entrante…');
        return () => { stopRing(); stopVibration(); };
    }, [callState, startRing, stopRing, startVibration, stopVibration]);

    // CONNECTED
    useEffect(() => {
        if (callState !== 'connected') return;

        setStatusText('Conectando…');

        const timeout = setTimeout(() => {
            // Setup audio analyser
            const ctx = getAudioCtx();
            const audioEl = audioRef.current;
            if (ctx && audioEl) {
                try {
                    const source = ctx.createMediaElementSource(audioEl);
                    const analyser = ctx.createAnalyser();
                    analyser.fftSize = 512;
                    analyser.smoothingTimeConstant = 0.8;
                    source.connect(analyser);
                    analyser.connect(ctx.destination);
                    analyserRef.current = analyser;
                } catch (_) {
                    // MediaElementSource already created
                }
                audioEl.play().catch(() => {});

                audioEl.addEventListener('ended', () => {
                    stopTimer();
                    stopSpectrum();
                    setCallState('ended');
                }, { once: true });
            }

            startTimer();
            startSpectrum();
        }, 700);

        return () => clearTimeout(timeout);
    }, [callState, getAudioCtx, startTimer, stopTimer, startSpectrum, stopSpectrum]);

    // ENDED
    useEffect(() => {
        if (callState !== 'ended') return;

        // Play end sound
        const endedAudio = endedAudioRef.current;
        if (endedAudio) {
            endedAudio.currentTime = 0;
            endedAudio.play().catch(() => {});
        }

        // After 3.5 s, dismiss
        const timeout = setTimeout(() => setCallState('dismissed'), 3500);
        return () => clearTimeout(timeout);
    }, [callState]);

    // DISMISSED — restore scroll
    useEffect(() => {
        if (callState !== 'dismissed') return;

        const timer = setTimeout(() => {
            const el = overlayRef.current;
            if (el) el.style.display = 'none';

            const scrollContainer = document.querySelector('.chat-dialog-content') as HTMLElement | null;
            if (scrollContainer) {
                scrollContainer.style.overflow  = '';
                scrollContainer.style.overflowY = 'auto';
            }
        }, 600);
        return () => clearTimeout(timer);
    }, [callState]);

    // ── Answer handler ───────────────────────────────────────
    const handleAnswer = useCallback(() => {
        if (callState !== 'ringing') return;
        stopRing();
        stopVibration();
        setCallState('connected');
    }, [callState, stopRing, stopVibration]);

    // ── Derived state ────────────────────────────────────────
    const isActive    = callState !== 'idle' && callState !== 'dismissed';
    const isFading    = callState === 'dismissed';
    const isConnected = callState === 'connected';
    const isEnded     = callState === 'ended';
    const isRinging   = callState === 'ringing';
    const finalTime   = `${pad(Math.floor(secondsRef.current / 60))}:${pad(secondsRef.current % 60)}`;

    // ── CSS classes ──────────────────────────────────────────
    const overlayClasses = [
        'chat__call',
        isActive  && 'chat__call--active',
        isFading  && 'chat__call--fading',
    ].filter(Boolean).join(' ');

    // ── Render ────────────────────────────────────────────────
    return (
        <div
            ref={overlayRef}
            class={overlayClasses}
            role="dialog"
            aria-modal={true}
            aria-label="Llamada entrante"
            {...(!isActive && { inert: true })}
        >
            {/* Blurred background */}
            <div class="chat__call--bg">
                {callerImage && <img src={callerImage} alt="" aria-hidden={true} />}
            </div>

            {/* ══ INCOMING STATE ══════════════════════════════ */}
            <div
                class="chat__call--top"
                style={isConnected || isEnded ? { opacity: 0, pointerEvents: 'none' } : undefined}
            >
                <p class="chat__call--label">{callerLabel}</p>
                <h2 class="chat__call--name">{callerName}</h2>
                <p class="chat__call--status">{statusText}</p>
            </div>

            <div
                class="chat__call--avatar-wrap"
                style={isConnected || isEnded ? { opacity: 0, pointerEvents: 'none' } : undefined}
            >
                {isRinging && (
                    <>
                        <div class="chat__call--pulse" />
                        <div class="chat__call--pulse" />
                        <div class="chat__call--pulse" />
                    </>
                )}
                {callerImage
                    ? <img class="chat__call--avatar" src={callerImage} alt={callerImageAlt} />
                    : <div class="chat__call--avatar-placeholder"><AvatarPlaceholderSvg /></div>
                }
            </div>

            <div
                class="chat__call--controls"
                style={isConnected || isEnded ? { opacity: 0, pointerEvents: 'none' } : undefined}
            >
                <div class="chat__call--btn-wrap">
                    <button
                        class="chat__call--btn-answer"
                        aria-label="Contestar llamada"
                        onClick={handleAnswer}
                    >
                        <PhoneSvg />
                    </button>
                    <span>Contestar</span>
                </div>
            </div>

            {/* ══ CONNECTED STATE ═════════════════════════════ */}
            <div
                class={`chat__call--connected ${isConnected ? 'chat__call--connected-visible' : ''}`}
                style={isEnded ? { opacity: 0 } : undefined}
            >
                <p class="chat__call--connected-timer" aria-live="polite">{timerText}</p>
                <p class="chat__call--connected-name">{callerName}</p>
                <div style={{ flex: 1 }} />
                {callerImage
                    ? <img class="chat__call--connected-avatar" src={callerImage} alt={callerImageAlt} />
                    : <div class="chat__call--connected-avatar-placeholder"><AvatarPlaceholderSvg /></div>
                }
                <canvas ref={canvasRef} class="chat__call--spectrum" aria-hidden={true} />
                <div style={{ flex: 1 }} />
            </div>

            {/* ══ CALL ENDED ══════════════════════════════════ */}
            <div class={`chat__call--ended ${isEnded ? 'chat__call--ended-visible' : ''}`}>
                <div class="chat__call--ended-icon">
                    <PhoneSvg />
                </div>
                <p class="chat__call--ended-title">Llamada finalizada</p>
                <p class="chat__call--ended-duration">{isEnded ? finalTime : '00:00'}</p>
            </div>

            {/* ── Hidden audio elements ──────────────────────── */}
            {audioSrc     && <audio ref={audioRef}      src={audioSrc}     preload="auto" style={{ display: 'none' }} />}
            {ringtoneSrc  && <audio ref={ringRef}        src={ringtoneSrc}  preload="auto" loop style={{ display: 'none' }} />}
            {callEndedSrc && <audio ref={endedAudioRef}  src={callEndedSrc} preload="auto" style={{ display: 'none' }} />}
        </div>
    );
};

export default IncomingCall;
