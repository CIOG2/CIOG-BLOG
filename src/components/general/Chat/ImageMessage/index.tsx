import { useEffect, useRef, useState } from 'preact/hooks';
import './styles.scss';

type ImageMessageProps = {
    src: string;
    alt?: string;
};

export default function ImageMessage({ src, alt = 'Image' }: ImageMessageProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [isZoomed, setIsZoomed] = useState(false);

    const handleOpen = () => { 
        setIsZoomed(false); 
        dialogRef.current?.showModal(); 
        document.body.style.overflow = 'hidden';
    };
    
    const handleClose = () => { 
        setIsZoomed(false); 
        dialogRef.current?.close(); 
        document.body.style.overflow = '';
    };

    const handleBackdropClick = (e: MouseEvent) => {
        // Since the dialog occupies the entire screen, clicking its boundary acts as backdrop tap
        if (e.target === dialogRef.current) {
            handleClose();
        }
    };
    
    const handleImageClick = (e: MouseEvent) => {
        e.stopPropagation();
        setIsZoomed(!isZoomed);
    };

    // Clean up body overflow on unmount just in case
    useEffect(() => {
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        <div class="chat-image-msg">
            <img 
                src={src} 
                alt={alt} 
                loading="lazy" 
                decoding="async"
                onClick={handleOpen}
                class="chat-image-msg__thumb"
            />

            <dialog 
                ref={dialogRef} 
                class="chat-image-modal" 
                onClick={handleBackdropClick}
                onClose={handleClose}
            >
                <img 
                    src={src} 
                    alt={alt} 
                    class={`chat-image-modal__img ${isZoomed ? 'is-zoomed' : ''}`}
                    onClick={handleImageClick}
                    title={isZoomed ? "Alejar" : "Acercar"}
                />
            </dialog>
        </div>
    );
}
