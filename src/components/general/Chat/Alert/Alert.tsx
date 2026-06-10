import type { FunctionComponent, ComponentChildren } from 'preact';
import './styles.scss';

// ── SVG icons ────────────────────────────────────────────────
const ClockIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" role="presentation">
        <path d="M12 20.5A8.5 8.5 0 1 1 20.5 12 8.51 8.51 0 0 1 12 20.5Zm0-15A6.5 6.5 0 1 0 18.5 12 6.51 6.51 0 0 0 12 5.5Zm3.25 7H12a.75.75 0 0 1-.75-.75V8.5a.75.75 0 1 1 1.5 0v2.75h2.5a.75.75 0 0 1 0 1.5Z" />
    </svg>
);

const InfoIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" role="presentation">
        <path d="M12 20.5a8.5 8.5 0 1 1 8.5-8.5 8.51 8.51 0 0 1-8.5 8.5Zm0-15A6.5 6.5 0 1 0 18.5 12 6.51 6.51 0 0 0 12 5.5Zm0 9.25A.75.75 0 0 1 11.25 14v-3.5a.75.75 0 0 1 1.5 0V14A.75.75 0 0 1 12 14.75Zm0-5.5a1 1 0 1 1 1-1 1 1 0 0 1-1 1Z" />
    </svg>
);

// ── Types ────────────────────────────────────────────────────
interface AlertProps {
    label: string;
    variant?: 'time' | 'blocked' | 'info';
    showLines?: boolean;
    icon?: ComponentChildren;
}

// ── Component ────────────────────────────────────────────────
const Alert: FunctionComponent<AlertProps> = ({
    label,
    variant = 'time',
    showLines = true,
    icon,
}) => {
    const containerClasses = ['chat__alert', `chat__alert--${variant}`].filter(Boolean).join(' ');
    const hasCustomIcon = !!icon;
    const showIcon = hasCustomIcon || ['time', 'blocked'].includes(variant);

    return (
        <div class={containerClasses}>
            {showLines && <span class="chat__alert--line" aria-hidden={true} />}

            <div class="chat__alert--bubble">
                {showIcon && (
                    <span class="chat__alert--icon" aria-hidden={true}>
                        {hasCustomIcon && icon}
                        {!hasCustomIcon && variant === 'time' && <ClockIcon />}
                        {!hasCustomIcon && variant === 'blocked' && <InfoIcon />}
                    </span>
                )}
                <span class="chat__alert--label">{label}</span>
            </div>

            {showLines && <span class="chat__alert--line" aria-hidden={true} />}
        </div>
    );
};

export default Alert;
