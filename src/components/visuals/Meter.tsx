import { pct } from '../../game';

interface MeterFeedback {
  id: number;
  delta: number;
}

export function Meter({
  label,
  value,
  tone,
  feedback,
}: {
  label: string;
  value: number;
  tone: string;
  feedback?: MeterFeedback;
}) {
  return (
    <div className={`meter ${feedback ? 'meter-reacting' : ''}`}>
      <div className="meter-label">
        <span>{label}</span>
        <strong>{Math.round(value)}%</strong>
      </div>
      <div className="meter-track">
        <span style={{ width: pct(value), background: tone }} />
      </div>
      {feedback && (
        <em className={`meter-delta ${feedback.delta < 0 ? 'negative' : ''}`} key={feedback.id} aria-hidden="true">
          {feedback.delta > 0 ? '+' : ''}
          {Math.round(feedback.delta)}
        </em>
      )}
    </div>
  );
}
