import type { FunctionComponent } from 'preact';
import './styles.scss';

const TypingIndicator: FunctionComponent = () => (
    <div
        class="chat__typing-indicator"
        id="chat-typing-indicator"
        style={{ display: 'none', opacity: 0, transform: 'translateY(10px)' }}
    >
        <div class="chat__typing-indicator--bubble">
            <span class="chat__typing-indicator--dot" />
            <span class="chat__typing-indicator--dot" />
            <span class="chat__typing-indicator--dot" />
        </div>
    </div>
);

export default TypingIndicator;
