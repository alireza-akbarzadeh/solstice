import { useEffect } from "react";
import { useSanctuaryStore } from "./sanctuary-store";

/**
 * Runs the Samavritti 4:4 pranayama circular timer:
 * 4s Inhale -> 4s Retain -> 4s Exhale -> 4s Empty
 */
export function usePranayamaCycle() {
  const tickBreath = useSanctuaryStore((state) => state.tickBreath);

  useEffect(() => {
    const timer = setInterval(() => {
      tickBreath();
    }, 1000);

    return () => clearInterval(timer);
  }, [tickBreath]);
}
