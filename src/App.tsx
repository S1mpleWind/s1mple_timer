import { useEffect, useMemo, useState } from "react";

type TimerState = {
  running: boolean;
  durationSec: number;
  remainingSec: number;
};

declare global {
  interface Window {
    timerApi?: {
      getTimerState: () => Promise<TimerState>;
      startTimer: () => Promise<TimerState>;
      pauseTimer: () => Promise<TimerState>;
      resetTimer: () => Promise<TimerState>;
      applyMinutes: (minutes: number) => Promise<TimerState>;
      onTimerState: (callback: (state: TimerState) => void) => () => void;
    };
  }
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function formatClock(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatRemain(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${pad(m)}:${pad(s)}`;
}

export default function App() {
  const [now, setNow] = useState(new Date());
  const [minutes, setMinutes] = useState(50);
  const [remain, setRemain] = useState(50 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!window.timerApi) {
      return;
    }

    const syncState = (state: TimerState) => {
      setRemain(state.remainingSec);
      setRunning(state.running);
      setMinutes(Math.max(1, Math.round(state.durationSec / 60)));
    };

    const unsubscribe = window.timerApi.onTimerState(syncState);

    void window.timerApi.getTimerState().then(syncState);

    return () => {
      unsubscribe();
    };
  }, []);

  const canStart = useMemo(() => remain > 0 && !running, [remain, running]);

  const start = async () => {
    if (!canStart || !window.timerApi) return;
    const nextState = await window.timerApi.startTimer();
    setRemain(nextState.remainingSec);
    setRunning(nextState.running);
  };

  const pause = async () => {
    if (!running || !window.timerApi) return;
    const nextState = await window.timerApi.pauseTimer();
    setRemain(nextState.remainingSec);
    setRunning(nextState.running);
  };

  const applyMinutes = async () => {
    if (running || !window.timerApi) return;
    const m = Math.max(1, Math.min(180, minutes));
    const nextState = await window.timerApi.applyMinutes(m);
    setMinutes(Math.max(1, Math.round(nextState.durationSec / 60)));
    setRemain(nextState.remainingSec);
    setRunning(nextState.running);
  };

  const reset = async () => {
    if (!window.timerApi) return;
    const nextState = await window.timerApi.resetTimer();
    setRemain(nextState.remainingSec);
    setRunning(nextState.running);
  };

  return (
    <>
      <style>{`
        :root {
          --bg-top: #f7f0e4;
          --bg-bottom: #d8e7f6;
          --card: rgba(255, 255, 255, 0.9);
          --ink: #202227;
          --muted: #5a6070;
          --accent: #587270;
          --accent-2: #f59e0b;
          --danger: #e11d48;
        }

        * { box-sizing: border-box; }

        body {
          margin: 0;
          min-height: 100vh;
          background:
            radial-gradient(circle at 12% 18%, rgba(245, 158, 11, 0.22), transparent 32%),
            radial-gradient(circle at 86% 12%, rgba(15, 118, 110, 0.22), transparent 28%),
            linear-gradient(145deg, var(--bg-top), var(--bg-bottom));
          color: var(--ink);
          font-family: "Avenir Next", "Futura", "Trebuchet MS", sans-serif;
        }

        #root {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
        }

        .timer-shell {
          width: min(430px, 100%);
          border-radius: 24px;
          padding: 24px;
          background: var(--card);
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 24px 70px rgba(30, 41, 59, 0.2);
          backdrop-filter: blur(8px);
          animation: rise-in 420ms ease-out;
        }

        .timer-title {
          margin: 0 0 18px;
          font-size: 27px;
          letter-spacing: 0.7px;
        }

        .panel {
          background: rgba(255, 255, 255, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.75);
          border-radius: 16px;
          padding: 14px 16px;
          margin-bottom: 14px;
        }

        .label {
          color: var(--muted);
          font-size: 13px;
          letter-spacing: 0.2px;
          margin-bottom: 4px;
        }

        .clock {
          font-size: clamp(30px, 7vw, 38px);
          font-weight: 700;
        }

        .remain {
          font-size: clamp(54px, 12vw, 66px);
          font-weight: 800;
          letter-spacing: 1px;
          line-height: 1;
          color: #0b1726;
          text-shadow: 0 6px 18px rgba(15, 118, 110, 0.2);
          animation: pulse-soft 1.4s ease-in-out infinite;
          animation-play-state: ${running ? "running" : "paused"};
        }

        .btn-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin: 16px 0 20px;
        }

        .btn {
          border: 0;
          border-radius: 12px;
          padding: 10px 12px;
          font-weight: 700;
          color: white;
          cursor: pointer;
          transition: transform 120ms ease, filter 120ms ease, opacity 120ms ease;
        }

        .btn:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(1.05);
        }

        .btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn:disabled {
          opacity: 0.42;
          cursor: not-allowed;
        }

        .btn-start { background: linear-gradient(135deg, #98c6c2, #68a8a3); }
        .btn-pause { background: linear-gradient(135deg, #d0b98e, #cb956e); }
        .btn-reset { background: linear-gradient(135deg, #b97e8e, #e16681); }

        .settings {
          border-top: 1px solid rgba(90, 96, 112, 0.2);
          padding-top: 16px;
        }

        .settings-title {
          margin: 0 0 8px;
          font-size: 14px;
          font-weight: 700;
        }

        .settings-row {
          display: flex;
          gap: 10px;
        }

        .minutes-input {
          width: 84px;
          border: 1px solid rgba(15, 118, 110, 0.35);
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 15px;
          outline: none;
          background: #ffffff;
        }

        .minutes-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.15);
        }

        .btn-apply {
          border: 0;
          border-radius: 10px;
          padding: 8px 14px;
          font-weight: 700;
          color: white;
          background: linear-gradient(135deg, #7997e8, #697fb0);
          cursor: pointer;
          transition: opacity 120ms ease;
        }

        .btn-apply:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 520px) {
          #root { padding: 14px; }
          .timer-shell { border-radius: 18px; padding: 18px; }
        }

        @keyframes rise-in {
          from { opacity: 0; transform: translateY(14px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes pulse-soft {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.015); }
        }
      `}</style>

      <div className="timer-shell">
        <h2 className="timer-title">S1mple Timer</h2>

        <div className="panel">
          <div className="label">当前时间</div>
          <div className="clock">{formatClock(now)}</div>
        </div>

        <div className="panel">
          <div className="label">倒计时</div>
          <div className="remain">{formatRemain(remain)}</div>
        </div>

        <div className="btn-row">
          <button className="btn btn-start" onClick={start} disabled={!canStart}>开始</button>
          <button className="btn btn-pause" onClick={pause} disabled={!running}>暂停</button>
          <button className="btn btn-reset" onClick={reset}>重置</button>
        </div>

        <div className="settings">
          <div className="settings-title">设置倒计时（分钟）</div>
          <div className="settings-row">
            <input
              className="minutes-input"
              type="number"
              min={1}
              max={180}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value || 1))}
            />
            <button className="btn-apply" onClick={applyMinutes} disabled={running}>应用</button>
          </div>
        </div>
      </div>
    </>
  );
}
