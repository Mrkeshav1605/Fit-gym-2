/** Small hooks used across pages. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../contexts/ToastContext.jsx';

/** Fetch data with loading/error/refetch. */
export function useApi(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await fnRef.current();
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load, ...deps]);

  return { data, loading, error, refetch: load };
}

/** Set the document title (SEO per page). */
export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — IronPulse Gym` : 'IronPulse Gym — Smart Gym Fitness Platform';
  }, [title]);
}

/** Reveal-on-scroll animation for sections. Watches for new elements
 *  (pages render content after data loads, so a one-time scan is not enough). */
export function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1 });

    const scan = () => {
      document.querySelectorAll('.reveal:not(.in)').forEach((el) => io.observe(el));
    };
    scan();

    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, []);
}

/** Countdown timer that can be paused/resumed/reset (rest timer etc). */
export function useCountdown(initial = 0) {
  const [remaining, setRemaining] = useState(initial);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  const start = useCallback((seconds) => {
    setRemaining(seconds);
    setRunning(true);
  }, []);

  useEffect(() => {
    if (!running) return undefined;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(intervalRef.current); setRunning(false); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const pause = useCallback(() => setRunning(false), []);
  const resume = useCallback(() => setRunning(true), []);
  const reset = useCallback(() => { setRunning(false); setRemaining(0); }, []);

  return { remaining, running, start, pause, resume, reset };
}

/** Stopwatch counting up (workout duration). */
export function useStopwatch() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running) return undefined;
    const startedAt = Date.now() - seconds * 1000;
    intervalRef.current = setInterval(() => setSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, seconds]);

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);
  const reset = useCallback(() => { setRunning(false); setSeconds(0); }, []);

  return { seconds, running, start, pause, reset };
}

export const fmtClock = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

/** 401 handling helper: shows a toast and returns true if session expired. */
export function useSessionGuard() {
  const { push } = useToast();
  return (e) => {
    if (e?.code === 'SESSION_EXPIRED' || e?.code === 'NOT_LOGGED_IN') {
      push('Your session has expired. Please log in again.', 'error');
      window.location.href = '/login';
      return true;
    }
    return false;
  };
}
