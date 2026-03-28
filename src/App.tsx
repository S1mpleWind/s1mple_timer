import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    timerApi?: {
      notifyFinished: (usedMinutes: number) => Promise<boolean>;
    };
  }
}

function buildReminderMessage(usedMinutes: number) {
  return `你已经使用电脑${usedMinutes}min了，休息一下眼睛，起身走走吧`;
}

async function notifyTimerFinished(usedMinutes: number) {
  const message = buildReminderMessage(usedMinutes);

  try {
    if (window.timerApi?.notifyFinished) {
      await window.timerApi.notifyFinished(usedMinutes);
      return;
    }

    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("S1mple Timer", { body: message });
        return;
      }

      if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          new Notification("S1mple Timer", { body: message });
          return;
        }
      }
    }
  } catch {
    // 通知失败不应影响主界面运行
  }

  window.alert(message);
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
  const timerRef = useRef<number | null>(null);
  const endAtRef = useRef<number | null>(null);
  const activeMinutesRef = useRef(50);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!running) return;

    const tick = () => {
      if (!endAtRef.current) return;

      const nextRemain = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setRemain(nextRemain);

      if (nextRemain <= 0) {
        window.clearInterval(timerRef.current!);
        timerRef.current = null;
        endAtRef.current = null;
        setRunning(false);
        void notifyTimerFinished(activeMinutesRef.current);
      }
    };

    tick();
    timerRef.current = window.setInterval(tick, 250);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [running]);

  const canStart = useMemo(() => remain > 0 && !running, [remain, running]);

  const start = () => {
    if (!canStart) return;
    activeMinutesRef.current = Math.max(1, Math.round(remain / 60));
    endAtRef.current = Date.now() + remain * 1000;
    setRunning(true);
  };

  const pause = () => {
    if (!running) return;

    if (endAtRef.current) {
      const nextRemain = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setRemain(nextRemain);
    }

    endAtRef.current = null;
    setRunning(false);
  };

  const applyMinutes = () => {
    if (running) return;
    const m = Math.max(1, Math.min(180, minutes));
    setMinutes(m);
    setRemain(m * 60);
  };

  const reset = () => {
    endAtRef.current = null;
    setRunning(false);
    setRemain(minutes * 60);
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
