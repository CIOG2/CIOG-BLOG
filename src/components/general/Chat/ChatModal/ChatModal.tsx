import { useEffect, useRef, useCallback } from 'preact/hooks';
import type { FunctionComponent, ComponentChildren } from 'preact';
import { gsap } from 'gsap';
import TypingIndicator from '../TypingIndicator/TypingIndicator';
import './styles.scss';

interface ChatModalProps {
    children: ComponentChildren;
}

const ChatModal: FunctionComponent<ChatModalProps> = ({ children }) => {
    const introRef     = useRef<HTMLDivElement>(null);
    const dialogRef    = useRef<HTMLDialogElement>(null);
    const contentRef   = useRef<HTMLDivElement>(null);
    const trackRef     = useRef<HTMLDivElement>(null);
    const thumbRef     = useRef<HTMLDivElement>(null);

    const timelineRef  = useRef<gsap.core.Timeline | null>(null);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasReached80Ref  = useRef(false);
    const hasReachedEndRef = useRef(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const callTimeoutRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasCalledRef     = useRef(false);

    // ── Custom scrollbar ─────────────────────────────────────
    const updateScrollbar = useCallback(() => {
        const sc    = contentRef.current;
        const track = trackRef.current;
        const thumb = thumbRef.current;
        if (!sc || !track || !thumb) return;

        const { scrollTop, scrollHeight, clientHeight } = sc;

        if (scrollHeight <= clientHeight) {
            track.style.display = 'none';
            return;
        }
        track.style.display = '';

        const ratio    = clientHeight / scrollHeight;
        const thumbH   = Math.max(ratio * clientHeight, 36);
        const maxScroll = scrollHeight - clientHeight;
        const thumbTop = (scrollTop / maxScroll) * (clientHeight - thumbH);

        thumb.style.height    = `${thumbH}px`;
        thumb.style.transform = `translateY(${thumbTop}px)`;

        track.classList.add('chat-scrollbar--visible');
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
            track.classList.remove('chat-scrollbar--visible');
        }, 1500);

        if (maxScroll > 0) {
            const scrollPercent = scrollTop / maxScroll;
            if (scrollPercent >= 0.8 && !hasReached80Ref.current) {
                hasReached80Ref.current = true;
                const statusEl = document.getElementById('chat-header-status');
                if (statusEl && statusEl.innerText.includes('últ. vez')) {
                    statusEl.innerText = 'en línea';
                }
            }
        }
    }, []);

    // ── Close handler ────────────────────────────────────────
    const closeChat = useCallback(() => {
        document.body.style.overflow = '';
        if (introRef.current) introRef.current.style.visibility = '';
    }, []);

    // ── Open handler ─────────────────────────────────────────
    const openChat = useCallback(() => {
        const dialog = dialogRef.current;
        const sc     = contentRef.current;
        if (!dialog) return;

        dialog.showModal();
        document.body.style.overflow = 'hidden';

        if (introRef.current) introRef.current.style.visibility = 'hidden';
        if (sc) sc.scrollTop = 0;

        sc?.addEventListener('scroll', updateScrollbar, { passive: true });

        // GSAP message animation — runs only once
        if (!timelineRef.current) {
            const interactiveMessages = dialog.querySelectorAll('.chat__message--interactive');
            const typingIndicator     = dialog.querySelector('#chat-typing-indicator') as HTMLElement | null;

            if (interactiveMessages.length > 0) {
                const tl = gsap.timeline();
                timelineRef.current = tl;

                interactiveMessages.forEach((msg) => {
                    const type       = msg.getAttribute('data-type');
                    const isReceived = type === 'received';
                    const msgEl      = msg as HTMLElement;

                    if (isReceived && typingIndicator) {
                        tl.call(() => {
                            msg.parentNode!.insertBefore(typingIndicator, msg);
                            typingIndicator.style.display = 'block';
                            gsap.to(typingIndicator, { opacity: 1, y: 0, duration: 0.3 });
                            if (sc) sc.scrollTo({ top: sc.scrollHeight, behavior: 'smooth' });

                            const statusEl = document.getElementById('chat-header-status');
                            if (statusEl) statusEl.innerText = 'escribiendo...';
                        });

                        tl.to({}, { duration: 1.8 });

                        tl.to(typingIndicator, { opacity: 0, y: 10, duration: 0.2 });
                        tl.call(() => { 
                            typingIndicator.style.display = 'none'; 
                            const statusEl = document.getElementById('chat-header-status');
                            if (statusEl) statusEl.innerText = 'en línea';
                        });
                    } else {
                        tl.to({}, { duration: 0.5 });
                    }

                    tl.call(() => { msgEl.style.display = 'flex'; });
                    tl.to(msgEl, {
                        opacity: 1,
                        y: 0,
                        duration: 0.4,
                        ease: 'power2.out',
                        onStart: () => {
                            if (sc) sc.scrollTo({ top: sc.scrollHeight, behavior: 'smooth' });
                        },
                    });
                });
            }
        }

        // IntersectionObserver for incoming call — ALWAYS set up when dialog opens
        const sentinel = dialog.querySelector('#chat-cta');
        if (sentinel && sc) {
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    if (!hasReachedEndRef.current && !hasCalledRef.current) {
                        hasReachedEndRef.current = true;
                        const statusEl = document.getElementById('chat-header-status');
                        const typingIndicator = dialog.querySelector('#chat-typing-indicator') as HTMLElement | null;
                        
                        // 1. Show 'escribiendo...' and animate typing indicator
                        if (statusEl) {
                            statusEl.innerText = 'escribiendo...';
                            statusEl.classList.add('chat__header--status-typing');
                        }
                        if (typingIndicator) {
                            sentinel.parentNode!.insertBefore(typingIndicator, sentinel);
                            typingIndicator.style.display = 'block';
                            gsap.to(typingIndicator, { opacity: 1, y: 0, duration: 0.3 });
                            sc.scrollTo({ top: sc.scrollHeight, behavior: 'smooth' });
                        }
                        
                        // 2. Regret (stop typing) after 3.5s of tension
                        typingTimeoutRef.current = setTimeout(() => {
                            if (statusEl) {
                                statusEl.innerText = 'en línea';
                                statusEl.classList.remove('chat__header--status-typing');
                            }
                            if (typingIndicator) {
                                gsap.to(typingIndicator, { opacity: 0, y: 10, duration: 0.2, onComplete: () => {
                                    typingIndicator.style.display = 'none';
                                }});
                            }
                            
                            // 3. Trigger call after 1s
                            callTimeoutRef.current = setTimeout(() => {
                                hasCalledRef.current = true;
                                observer.disconnect();
                                document.dispatchEvent(new CustomEvent('trigger-incoming-call'));
                            }, 1000);
                        }, 3500);
                    }
                } else {
                    // User scrolled up! Cancel everything
                    if (hasReachedEndRef.current && !hasCalledRef.current) {
                        hasReachedEndRef.current = false;
                        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                        if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
                        
                        const statusEl = document.getElementById('chat-header-status');
                        const typingIndicator = dialog.querySelector('#chat-typing-indicator') as HTMLElement | null;
                        
                        if (statusEl) {
                            statusEl.innerText = 'en línea';
                            statusEl.classList.remove('chat__header--status-typing');
                        }
                        if (typingIndicator) {
                            gsap.to(typingIndicator, { opacity: 0, y: 10, duration: 0.2, onComplete: () => {
                                typingIndicator.style.display = 'none';
                            }});
                        }
                    }
                }
            }, { root: sc, threshold: 0.1 });
            observer.observe(sentinel);
        }
    }, [updateScrollbar]);

    // ── Back button delegation ────────────────────────────────
    const handleWrapperClick = useCallback((e: Event) => {
        const target = e.target as HTMLElement;
        if (target.closest('.chat__header--back-btn')) {
            dialogRef.current?.close();
            closeChat();
        }
    }, [closeChat]);

    // ── Dialog close event (ESC key, etc.) ───────────────────
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const handler = () => closeChat();
        dialog.addEventListener('close', handler);
        return () => dialog.removeEventListener('close', handler);
    }, [closeChat]);

    return (
        <div class="chat-modal-wrapper" onClick={handleWrapperClick}>
            <div class="chat-modal-intro" ref={introRef}>
                <p>Esta es una historia inmersiva. Para vivir la experiencia completa, haz clic en el botón de abajo.</p>
                <button class="open-chat-btn" onClick={openChat}>Abrir chat</button>
            </div>

            <dialog class="chat-dialog" ref={dialogRef}>
                <div class="chat-dialog-inner">
                    <div class="chat-dialog-content not-prose" ref={contentRef}>
                        {children}
                        <TypingIndicator />
                    </div>
                    {/* Custom scrollbar overlay */}
                    <div class="chat-scrollbar" ref={trackRef} aria-hidden={true}>
                        <div class="chat-scrollbar__thumb" ref={thumbRef} />
                    </div>
                </div>
            </dialog>
        </div>
    );
};

export default ChatModal;
