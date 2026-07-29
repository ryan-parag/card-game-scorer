import React, { useState, useEffect } from 'react'
import NumberFlow from "@number-flow/react";

const DelayedNumber = ({ 
  initialValue = 0, 
  value = 100, 
  delay = 1000 
}) => {
  const [currentValue, setCurrentValue] = useState(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <span className="tabular-nums">
      <NumberFlow value={currentValue} />
    </span>
  );
};

export default DelayedNumber;