import { useState, useEffect, useRef } from 'preact/hooks';

export const WorkInProgressBanner = ({
  text = "Esto sigue en proceso. Pero hey, al menos ya no está en la carpeta de borradores.",
  emoji = "⌛",
  gradient = "linear-gradient(45deg, #fff8e1, #fff3e0, #ffe0b2)",
  fontSize = "1.25rem",
  borderColor = "#f9c74f"
}) => {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, index + 1));
      index++;
      if (index === text.length) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [isVisible, text]);

  return (
    <div
      ref={containerRef}
      class={`wip-banner ${isVisible ? "visible" : "hidden"}`}
      style={{
        background: gradient,
        borderColor: borderColor,
        fontSize,
      }}
    >
      <div class="loader-symbol">{emoji}</div>
      <div class="loader-text">
        <p>{displayedText}</p>
      </div>
      <style jsx>{`
        .wip-banner {
          position: relative;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 2rem;
          border: 2px dashed;
          background-size: 600% 600%;
          color: #4e342e;
          font-family: 'Inter', 'Courier New', Courier, monospace;
          border-radius: 16px;
          margin: 2rem 0;
          overflow: hidden;
          transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
        }

        .wip-banner.hidden {
          opacity: 0;
          transform: scale(0.95);
        }

        .wip-banner.visible {
          opacity: 1;
          transform: scale(1);
          animation: pulse 4s infinite, gradient 15s linear infinite;
        }

        .dark .wip-banner {
          background: linear-gradient(45deg, #2b2b2b, #1f1f1f, #2b2b2b);
          color: #f0f0f0;
        }

        .loader-symbol {
          font-size: 2.8rem;
          animation: spin 3s linear infinite, bounce 2s ease-in-out infinite;
        }

        .loader-text {
          overflow: hidden;
          animation: slideIn 1.5s ease-out forwards;
          white-space: normal;
          word-wrap: break-word;
        }

        .loader-text p {
          margin: 0;
          line-height: 1.6;
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(249, 199, 79, 0.7);
          }
          70% {
            box-shadow: 0 0 0 20px rgba(249, 199, 79, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(249, 199, 79, 0);
          }
        }

        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes slideIn {
          0% {
            transform: translateX(50px);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
