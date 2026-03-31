import './styles.scss';

type StickerMessageProps = {
    src: string;
    alt?: string;
};

// Stickers in WhatsApp do not open a full-screen image modal
export default function StickerMessage({ src, alt = 'Sticker' }: StickerMessageProps) {
    return (
        <div class="chat-sticker-msg">
            <img 
                src={src} 
                alt={alt} 
                loading="lazy" 
                decoding="async"
                class="chat-sticker-msg__thumb"
            />
        </div>
    );
}
