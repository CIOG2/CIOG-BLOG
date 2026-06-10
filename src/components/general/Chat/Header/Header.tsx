import { useEffect, useRef } from 'preact/hooks';
import type { FunctionComponent } from 'preact';
import './styles.scss';

interface HeaderProps {
    title: string;
    image: string;
    showBackButton?: boolean;
    status?: string;
}

const Header: FunctionComponent<HeaderProps> = ({
    title,
    image,
    showBackButton = false,
    status = 'últ. vez hoy a las 11:10 p. m.',
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const modal = modalRef.current;
        if (!modal) return;

        const handleClick = () => modal.classList.remove('active');
        modal.addEventListener('click', handleClick);
        return () => modal.removeEventListener('click', handleClick);
    }, []);

    const handlePicClick = (e: Event) => {
        e.stopPropagation();
        modalRef.current?.classList.add('active');
    };

    return (
        <>
            <header class="chat__header">
                <section class="chat__header--section">
                    {showBackButton && (
                        <button class="chat__header--back-btn" aria-label="Volver">
                            <svg viewBox="7 5 10 14" height="18" width="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        </button>
                    )}
                    <picture class="chat__header--picture" onClick={handlePicClick}>
                        <img class="chat__header--image" src={image} alt={title} />
                    </picture>
                    <div class="chat__header--text">
                        <p class="chat__header--title">{title}</p>
                        <p class="chat__header--status" id="chat-header-status">{status}</p>
                    </div>
                </section>
            </header>

            <div class="profile-pic-modal" ref={modalRef}>
                <div class="profile-pic-modal__bg" />
                <div class="profile-pic-modal__content">
                    <img class="profile-pic-modal__img" src={image} alt={title} />
                </div>
            </div>
        </>
    );
};

export default Header;
