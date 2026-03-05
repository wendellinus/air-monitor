import React from 'react';

export function useScreenClock(): Date {
  const [now, setNow] = React.useState<Date>(() => new Date());

  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return now;
}
