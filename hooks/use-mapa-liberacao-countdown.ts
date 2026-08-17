import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import {
  formatLiberacaoCountdownLabel,
  getCountdownTickDelay,
} from '@/utils/mapa-liberacao-countdown';
import { getServerNow } from '@/utils/server-time';

type UseMapaLiberacaoCountdownParams = {
  nextLiberacao: number | null;
  enabled?: boolean;
  onLiberacaoReached?: () => void;
};

export function useMapaLiberacaoCountdown({
  nextLiberacao,
  enabled = true,
  onLiberacaoReached,
}: UseMapaLiberacaoCountdownParams) {
  const [nowMs, setNowMs] = useState(() => getServerNow());
  const onLiberacaoReachedRef = useRef(onLiberacaoReached);
  const handledLiberacaoRef = useRef<number | null>(null);

  onLiberacaoReachedRef.current = onLiberacaoReached;

  useLayoutEffect(() => {
    handledLiberacaoRef.current = null;

    if (enabled) {
      setNowMs(getServerNow());
    }
  }, [enabled, nextLiberacao]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    function scheduleNextTick() {
      if (cancelled) {
        return;
      }

      const currentNow = getServerNow();
      setNowMs(currentNow);

      if (nextLiberacao != null && currentNow >= nextLiberacao) {
        if (handledLiberacaoRef.current !== nextLiberacao) {
          handledLiberacaoRef.current = nextLiberacao;
          onLiberacaoReachedRef.current?.();
        }
      }

      const remainingMs = nextLiberacao ? Math.max(0, nextLiberacao - currentNow) : 0;
      timeoutId = setTimeout(
        scheduleNextTick,
        getCountdownTickDelay(remainingMs, nextLiberacao != null),
      );
    }

    scheduleNextTick();

    return () => {
      cancelled = true;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [enabled, nextLiberacao]);

  const remainingMs = useMemo(() => {
    if (nextLiberacao == null) {
      return 0;
    }

    return Math.max(0, nextLiberacao - nowMs);
  }, [nextLiberacao, nowMs]);

  return {
    visible: enabled && nextLiberacao != null,
    formattedTime: formatLiberacaoCountdownLabel(nextLiberacao, remainingMs),
    remainingMs,
  };
}
