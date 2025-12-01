import { useEffect, useRef, useState } from 'react';

// A small top-of-page progress bar indicating navigation/loading
// Color uses existing CSS variables; no theme color changes.
export default function TopProgressBar() {
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const start = () => {
    // Reset any previous timers
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);

    setVisible(true);
    setWidth(0);

    // Progress animation: quick to 60-70%, then wait, then complete
    let w = 0;
    timerRef.current = window.setInterval(() => {
      w += Math.random() * 15 + 10; // 10-25% increments
      if (w >= 85) w = 85;
      setWidth(w);
    }, 200);
  };

  const complete = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    setWidth(100);
    hideTimerRef.current = window.setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 300);
  };

  useEffect(() => {
    // Intercept pushState/replaceState and listen to back/forward
    const origPush = history.pushState;
    const origReplace = history.replaceState;

    (history.pushState as any) = function () {
      start();
      // bind to history to avoid implicit any on `this`
      return (origPush as any).apply(history, arguments as any);
    };
    (history.replaceState as any) = function () {
      start();
      return (origReplace as any).apply(history, arguments as any);
    };

    const onPop = () => start();
    window.addEventListener('popstate', onPop);

    // Heuristic: consider navigation "done" shortly after the microtask queue flushes
    const onDone = () => complete();
    window.addEventListener('load', onDone);

    // Also complete after a small delay to avoid sticking
    const idleDone = () => complete();
    const idleTimer = window.setTimeout(idleDone, 900);

    return () => {
      (history.pushState as any) = origPush;
      (history.replaceState as any) = origReplace;
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('load', onDone);
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
      window.clearTimeout(idleTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed left-0 top-0 z-[9999] w-full">
      <div
        className="h-0.5 bg-[hsl(var(--primary))] transition-[width] duration-200 ease-out"
        style={{ width: `${width}%` }}
      />
      {/* Optional subtle glow */}
      <div
        className="h-px bg-[hsl(var(--primary))]/30 blur-[1px]"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
