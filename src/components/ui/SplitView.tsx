import React, { useRef, useState } from 'react';
import './SplitView.css';

interface SplitViewProps {
  children: [React.ReactNode, React.ReactNode];
  initialSplit?: number; // percentage 0-100
  minSize?: number; // pixels
  className?: string;
  onSplitChange?: (percent: number) => void;
}

export default function SplitView({
  children,
  initialSplit = 20,
  minSize = 50,
  className = '',
  onSplitChange
}: SplitViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [splitPercent, setSplitPercent] = useState(initialSplit);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newX = e.clientX - containerRect.left;
    
    // Calculate percentage
    let newPercent = (newX / containerRect.width) * 100;
    
    // Apply constraints
    const minPercent = (minSize / containerRect.width) * 100;
    const maxPercent = 100 - minPercent;
    
    newPercent = Math.max(minPercent, Math.min(maxPercent, newPercent));
    
    setSplitPercent(newPercent);
    onSplitChange?.(newPercent);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  return (
    <div className={`split-view ${className}`} ref={containerRef}>
      <div 
        className="split-view__pane split-view__pane--left"
        style={{ width: `${splitPercent}%` }}
      >
        {children[0]}
      </div>
      
      <div
        className={`split-view__resizer ${isDragging ? 'is-dragging' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        role="separator"
        aria-valuenow={splitPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="split-view__resizer-line" />
      </div>

      <div className="split-view__pane split-view__pane--right">
        {children[1]}
      </div>
    </div>
  );
}
