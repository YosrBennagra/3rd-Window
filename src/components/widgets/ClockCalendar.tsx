import { useEffect, useState } from 'react';

export default function ClockCalendar() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="stat">
      <p className="muted tiny">Today</p>
      <p className="stat__value">{time}</p>
      <p className="muted">{date}</p>
    </div>
  );
}
