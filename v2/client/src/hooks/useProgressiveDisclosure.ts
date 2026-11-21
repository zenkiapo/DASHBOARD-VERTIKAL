import { useEffect, useRef, useState } from "react";

export function useProgressiveDisclosure<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(hover: none), (pointer: coarse)");
    const updatePointerType = () => {
      setIsTouchDevice(query.matches);
      if (!query.matches) setIsInView(false);
    };

    updatePointerType();
    query.addEventListener("change", updatePointerType);
    return () => query.removeEventListener("change", updatePointerType);
  }, []);

  useEffect(() => {
    if (!isTouchDevice || !ref.current) return;

    if (!("IntersectionObserver" in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [isTouchDevice]);

  return { ref, isTouchDevice, isInView };
}
