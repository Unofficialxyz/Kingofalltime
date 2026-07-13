import { useMemo, useState } from 'react';
import type { Candle, Timeframe } from '../lib/types';
import { sma, ema, bollingerBands, vwap } from '../lib/indicators';

interface Props {
  candles: Candle[];
  currency: string;
  timeframe: Timeframe;
  showVolume?: boolean;
}

type Overlay = 'none' | 'sma' | 'ema' | 'bb' | 'vwap';

export function PriceChart({ candles, currency, timeframe, showVolume = true }: Props) {
  const [overlay, setOverlay] = useState<Overlay>('sma');
  const [hover, setHover] = useState<number | null>(null);

  const W = 760, H = 320, padL = 8, padR = 56, padT = 12, padB = 24;
  const volH = showVolume ? 48 : 0;
  const plotH = H - padT - padB - volH - (showVolume ? 6 : 0);
  const plotW = W - padL - padR;

  const data = useMemo(() => {
    if (!candles.length) return null;
    const closes = candles.map((c) => c.c);
    const sma20 = sma(closes, 20);
    const sma50 = sma(closes, 50);
    const ema20 = ema(closes, 20);
    const bb = bollingerBands(closes, 20, 2);
    const vwapArr = vwap(candles);
    const highs = candles.map((c) => c.h);
    const lows = candles.map((c) => c.l);
    const max = Math.max(...highs);
    const min = Math.min(...lows);
    const range = max - min || 1;
    const volMax = Math.max(...candles.map((c) => c.v)) || 1;
    const x = (i: number) => padL + (i / (candles.length - 1 || 1)) * plotW;
    const y = (p: number) => padT + (1 - (p - min) / range) * plotH;
    const yVol = (v: number) => H - padB - (v / volMax) * volH;
    return { x, y, yVol, sma20, sma50, ema20, bb, vwapArr, min, max, volMax };
  }, [candles, plotW, plotH, volH]);

  if (!data) return <div className="h-[320px] grid place-items-center text-ink-500 text-sm">No data</div>;

  const { x, y, yVol, sma20, sma50, ema20, bb, vwapArr, min, max } = data;
  const cw = Math.max(1.5, plotW / candles.length - 1);

  const line = (arr: (number | null)[]) =>
    arr.map((v, i) => (v === null ? '' : `${x(i)},${y(v)}`)).filter(Boolean).join(' ');

  const gridLines = 5;
  const priceTicks = Array.from({ length: gridLines + 1 }, (_, i) => min + (i / gridLines) * (max - min));

  const hovered = hover !== null ? candles[hover] : candles[candles.length - 1];
  const hoverChange = hovered && candles[hover ? hover - 1 : candles.length - 2]
    ? hovered.c - (candles[hover ? hover - 1 : candles.length - 2] ?? hovered).c
    : 0;

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs text-ink-400 mr-1">Overlays:</span>
        {(['none', 'sma', 'ema', 'bb', 'vwap'] as Overlay[]).map((o) => (
          <button
            key={o}
            onClick={() => setOverlay(o)}
            className={`chip border ${overlay === o ? 'border-brand-500 bg-brand-500/15 text-brand-300' : 'border-white/10 text-ink-400 hover:text-ink-200'}`}
          >
            {o === 'none' ? 'None' : o.toUpperCase()}
          </button>
        ))}
        <span className="ml-auto text-xs text-ink-500">{timeframe} · {candles.length} bars</span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const px = ((e.clientX - rect.left) / rect.width) * W;
          const i = Math.round(((px - padL) / plotW) * (candles.length - 1));
          setHover(Math.max(0, Math.min(candles.length - 1, i)));
        }}
      >
        {/* grid */}
        {priceTicks.map((p, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={y(p)} y2={y(p)} stroke="rgba(255,255,255,0.05)" />
            <text x={W - padR + 6} y={y(p) + 3} className="fill-ink-500" style={{ fontSize: 10 }}>
              {p.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </text>
          </g>
        ))}

        {/* volume */}
        {showVolume && candles.map((c, i) => (
          <rect
            key={i}
            x={x(i) - cw / 2}
            y={yVol(c.v)}
            width={cw}
            height={H - padB - yVol(c.v)}
            fill={c.c >= c.o ? 'rgba(22,199,132,0.25)' : 'rgba(234,57,67,0.25)'}
          />
        ))}

        {/* candles */}
        {candles.map((c, i) => {
          const up = c.c >= c.o;
          const color = up ? '#16c784' : '#ea3943';
          const bodyTop = y(Math.max(c.o, c.c));
          const bodyBot = y(Math.min(c.o, c.c));
          return (
            <g key={i} opacity={hover === null || hover === i ? 1 : 0.55}>
              <line x1={x(i)} x2={x(i)} y1={y(c.h)} y2={y(c.l)} stroke={color} strokeWidth={1} />
              <rect x={x(i) - cw / 2} y={bodyTop} width={cw} height={Math.max(1, bodyBot - bodyTop)} fill={color} />
            </g>
          );
        })}

        {/* overlays */}
        {overlay === 'sma' && (
          <>
            <polyline points={line(sma20)} fill="none" stroke="#f59e0b" strokeWidth={1.5} />
            <polyline points={line(sma50)} fill="none" stroke="#3b82f6" strokeWidth={1.5} />
          </>
        )}
        {overlay === 'ema' && (
          <polyline points={line(ema20)} fill="none" stroke="#a855f7" strokeWidth={1.5} />
        )}
        {overlay === 'bb' && (
          <>
            <polyline points={line(bb.upper)} fill="none" stroke="rgba(22,199,132,0.6)" strokeWidth={1} />
            <polyline points={line(bb.mid)} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1} strokeDasharray="3 3" />
            <polyline points={line(bb.lower)} fill="none" stroke="rgba(234,57,67,0.6)" strokeWidth={1} />
          </>
        )}
        {overlay === 'vwap' && (
          <polyline points={line(vwapArr)} fill="none" stroke="#06b6d4" strokeWidth={1.5} />
        )}

        {/* hover crosshair */}
        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={padT} y2={H - padB} stroke="rgba(255,255,255,0.25)" strokeDasharray="3 3" />
        )}
      </svg>

      {/* hover tooltip */}
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs font-mono text-ink-300">
        <span>O <span className="text-ink-100">{hovered.o}</span></span>
        <span>H <span className="text-bull">{hovered.h}</span></span>
        <span>L <span className="text-bear">{hovered.l}</span></span>
        <span>C <span className="text-ink-100">{hovered.c}</span></span>
        <span className={hoverChange >= 0 ? 'text-bull' : 'text-bear'}>
          {hoverChange >= 0 ? '+' : ''}{hoverChange.toFixed(2)} ({((hoverChange / (hovered.c - hoverChange || 1)) * 100).toFixed(2)}%)
        </span>
        <span className="text-ink-500">Vol {hovered.v.toLocaleString()}</span>
        <span className="text-ink-500">{currency}</span>
      </div>
    </div>
  );
}
