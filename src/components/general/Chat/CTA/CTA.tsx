import { useCallback, useRef } from 'preact/hooks';
import type { FunctionComponent } from 'preact';
import './styles.scss';

// ── SVG Icons ────────────────────────────────────────────────
const InstagramSvg = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
);

const PenSvg = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
);

const ShareSvg = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
);

const ChevronSvg = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

// ── Types ────────────────────────────────────────────────────
interface CTAProps {
    avatarSrc?: string;
    avatarAlt?: string;
    name?: string;
    username?: string;
    message?: string;
    instagramUrl?: string;
    blogUrl?: string;
}

// ── Component ────────────────────────────────────────────────
const CTA: FunctionComponent<CTAProps> = ({
    avatarSrc,
    avatarAlt = 'ciog',
    name = 'ciog',
    username = '@ciog.dev',
    message = '¿Qué te pareció la experiencia? Cuéntame. 👻',
    instagramUrl = 'https://www.instagram.com/ciog.dev/',
    blogUrl = 'https://ciog.dev/blog',
}) => {
    const shareLabelRef = useRef<HTMLSpanElement>(null);

    const handleShare = useCallback(async () => {
        const url   = window.location.href;
        const title = document.title;
        const text  = '¿Ya leíste este cuento de terror? 👻';

        if (navigator.share) {
            try { await navigator.share({ title, text, url }); } catch (_) {}
        } else {
            try {
                await navigator.clipboard.writeText(url);
                const span = shareLabelRef.current;
                if (span) {
                    const original = span.textContent;
                    span.textContent = '¡Enlace copiado! ✓';
                    setTimeout(() => { if (span) span.textContent = original; }, 2000);
                }
            } catch (_) {}
        }
    }, []);

    return (
        <div class="chat__cta" id="chat-cta">
            {/* Date-style divider */}
            <div class="chat__cta--divider">
                <span>FIN DEL CHAT</span>
            </div>

            {/* Action card */}
            <div class="chat__cta--card">
                <div class="chat__cta--card-header">
                    {avatarSrc && <img class="chat__cta--avatar" src={avatarSrc} alt={avatarAlt} />}
                    <div class="chat__cta--header-text">
                        <h4>{name}</h4>
                        <p>{username}</p>
                    </div>
                </div>

                <div class="chat__cta--body">
                    <p>{message}</p>
                </div>

                <div class="chat__cta--actions">
                    <a
                        id="cta-instagram-btn"
                        class="chat__cta--btn"
                        href={instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <InstagramSvg />
                        <span>Seguirme en Instagram</span>
                        <ChevronSvg />
                    </a>

                    <a id="cta-blog-btn" class="chat__cta--btn" href={blogUrl}>
                        <PenSvg />
                        <span>Leer más historias</span>
                        <ChevronSvg />
                    </a>

                    <button
                        id="cta-share-btn"
                        class="chat__cta--btn chat__cta--btn-share"
                        onClick={handleShare}
                    >
                        <ShareSvg />
                        <span ref={shareLabelRef}>Compartir este cuento</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CTA;
