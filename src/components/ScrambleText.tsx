import React, { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';

interface ScrambleTextProps {
  children: string;
  className?: string;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
  threshold?: number;
  duration?: number;
  delay?: number;
  triggerOnce?: boolean;
  trigger?: boolean;
}

export const ScrambleText: React.FC<ScrambleTextProps> = ({
  children,
  className = '',
  as: Component = 'span',
  threshold = 0.1,
  duration = 0.6,
  delay = 0,
  triggerOnce = true,
  trigger
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  
  const chars = "!<>-_\\/[]{}—=+*^?#________";

  useEffect(() => {
    const scrambleText = () => {
      if (!elementRef.current) return;

      const element = elementRef.current;
      const originalText = String(children || '');
      const textLength = originalText.length;

      if (textLength === 0) return;

      // Kill any existing timeline
      if (timelineRef.current) {
        timelineRef.current.kill();
      }

      // Create new timeline
      const tl = gsap.timeline({ delay });
      timelineRef.current = tl;

      // Set initial random text
      element.textContent = originalText.split('').map(char => 
        char === ' ' ? ' ' : chars[Math.floor(Math.random() * chars.length)]
      ).join('');

      // Animate each character position
      for (let i = 0; i < textLength; i++) {
        const targetChar = originalText[i];
        
        // Skip spaces
        if (targetChar === ' ') continue;

        tl.to({}, {
          duration: duration / textLength,
          ease: "none",
          onUpdate: function() {
            const progress = this.progress();
            let currentText = '';
            
            for (let j = 0; j < textLength; j++) {
              if (j < i) {
                // Characters before current index are final
                currentText += originalText[j];
              } else if (j === i) {
                // Current character interpolates from random to final
                if (progress === 1) {
                  currentText += targetChar;
                } else {
                  const randomChar = chars[Math.floor(Math.random() * chars.length)];
                  currentText += Math.random() < progress ? targetChar : randomChar;
                }
              } else {
                // Characters after current index are random
                const randomChar = chars[Math.floor(Math.random() * chars.length)];
                currentText += originalText[j] === ' ' ? ' ' : randomChar;
              }
            }
            
            element.textContent = currentText;
          }
        }, i * 0.05);
      }

      // Ensure final text is set
      tl.call(() => {
        element.textContent = originalText;
      });
    };

    const shouldTrigger = trigger !== undefined ? trigger : isVisible;
    if (shouldTrigger && (!triggerOnce || !hasTriggered)) {
      scrambleText();
      if (triggerOnce) {
        setHasTriggered(true);
      }
    }
  }, [children, duration, delay, chars, isVisible, hasTriggered, triggerOnce, trigger]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          if (!triggerOnce) {
            setIsVisible(false);
          }
        }
      },
      { threshold }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, [threshold, triggerOnce]);

  const ElementType = Component as 'span';
  
  return React.createElement(
    ElementType,
    {
      ref: elementRef,
      className
    },
    children
  );
};