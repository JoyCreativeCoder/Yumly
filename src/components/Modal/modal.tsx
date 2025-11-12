import { useState, useEffect } from "react";
import "./modal.css";

interface ModalProps {
  onCancel: () => void;
}

export default function Modal({ onCancel }: ModalProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let current = 0;
    const duration = 20000; // 20 seconds total
    const interval = 200; // update every 0.2s
    const steps = duration / interval;

    const timer = setInterval(() => {
      current++;
      setProgress(Math.min((current / steps) * 100, 100));
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="blured">
      <div className="modal-container animate-modal">
        <div className="spinner" />
        <h2>Extracting recipe...</h2>
        <p className="time-text">Estimated time: 15 to 25 seconds</p>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <button className="cancel-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
