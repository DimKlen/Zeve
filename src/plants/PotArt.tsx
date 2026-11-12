import { useId } from 'react';
import { ClipPath, Defs, G, Path, Rect, Circle } from 'react-native-svg';

import { isStroked, normalizePot, POT_GEOMETRY, potMarks, POTS } from './pots';

/** Pot de la mascotte (bord + corps + motif) dans le repère 100×110 de PlantAvatar. */
export function PotArt({ pot }: { pot?: number | null }) {
  const clipId = useId();
  const spec = POTS[normalizePot(pot)]!;
  const geo = POT_GEOMETRY[spec.shape];
  const stroked = isStroked(spec.pattern);
  return (
    <>
      <Rect
        x={geo.rim.x}
        y={geo.rim.y}
        width={geo.rim.w}
        height={geo.rim.h}
        rx={4}
        fill={spec.rim}
      />
      <Path d={geo.body} fill={spec.body} />
      {spec.pattern !== 'plain' && (
        <>
          <Defs>
            <ClipPath id={clipId}>
              <Path d={geo.body} />
            </ClipPath>
          </Defs>
          <G clipPath={`url(#${clipId})`}>
            {potMarks(spec.pattern).map((m, i) => {
              if (m.kind === 'rect')
                return <Rect key={i} x={m.x} y={m.y} width={m.w} height={m.h} fill={spec.ink} />;
              if (m.kind === 'circle')
                return <Circle key={i} cx={m.x} cy={m.y} r={m.r} fill={spec.ink} />;
              return (
                <Path
                  key={i}
                  d={m.d}
                  fill={stroked ? 'none' : spec.ink}
                  stroke={stroked ? spec.ink : undefined}
                  strokeWidth={stroked ? 1.8 : undefined}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}
          </G>
        </>
      )}
    </>
  );
}
