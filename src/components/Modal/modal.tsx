import { useState, useEffect } from "react";
import "./modal.css";

interface ModalProps {
  onCancel: () => void;
  isDone: boolean;
  errorMessage: string | null;
  errorType: "invalid" | "server" | null;
}

export default function Modal({
  onCancel,
  isDone,
  errorMessage,
  errorType,
}: ModalProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer: any;
    if (!isDone) {
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return 90;
          return prev + Math.random() * 4;
        });
      }, 200);
    }

    if (isDone && !errorMessage) {
      setProgress(100);
      setTimeout(onCancel, 500);
    }

    return () => clearInterval(timer);
  }, [onCancel, isDone, errorMessage]);

  return (
    <div className="blured">
      <div className="modal-container animate-modal">
        {errorMessage ? (
          <>
            {errorType === "invalid" ? (
              <>
                <img
                  src="/images/invalid.png"
                  className="invalid-img"
                  alt="Invalid query"
                />
                <h2>Invalid Search</h2>
              </>
            ) : (
              <>
                <img
                  src="/images/invalid.png"
                  className="invalid-img"
                  alt="Server error"
                />
                <h2>Something went wrong</h2>
              </>
            )}

            <p className="error-text">{errorMessage}</p>
          </>
        ) : (
          <>
            <div className="spinner" />
            <h2>Extracting recipe...</h2>
            <p className="time-text">Estimated time: 15 to 25 seconds</p>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        )}

        <button className="cancel-btn" onClick={onCancel}>
          {errorMessage ? "Close" : "Cancel"}
        </button>
      </div>
    </div>
  );
}
