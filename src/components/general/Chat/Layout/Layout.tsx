import type { FunctionComponent, ComponentChildren } from 'preact';
import './styles.scss';
import TypingIndicator from '../TypingIndicator/TypingIndicator';

interface LayoutProps {
    children: ComponentChildren;
}

const Layout: FunctionComponent<LayoutProps> = ({ children }) => (
    <section class="chat__layout">
        <div class="chat__layout--banner" />
        {children}
        <TypingIndicator />
    </section>
);

export default Layout;
