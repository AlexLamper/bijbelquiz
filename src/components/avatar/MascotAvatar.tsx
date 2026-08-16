import { AvatarConfig, AvatarShape, buildAvatarShapes, describeAvatar, normalizeAvatar } from '@/lib/avatar';

/**
 * Draws a player mascot.
 *
 * Pure SVG with no external assets, so it renders on the server, scales to any
 * size, and costs nothing to repeat down a leaderboard. The shape list comes
 * from `lib/avatar.ts`, which the Flutter app mirrors.
 */

interface MascotAvatarProps {
  avatar: AvatarConfig | null | undefined;
  /** Rendered pixel size. The drawing itself is resolution independent. */
  size?: number;
  className?: string;
  /** Draw a hairline ring, the way the site frames photographs. */
  bordered?: boolean;
  title?: string;
}

function renderShape(shape: AvatarShape, key: number) {
  switch (shape.kind) {
    case 'circle':
      return <circle key={key} cx={shape.cx} cy={shape.cy} r={shape.r} fill={shape.fill} />;

    case 'ellipse':
      return (
        <ellipse
          key={key}
          cx={shape.cx}
          cy={shape.cy}
          rx={shape.rx}
          ry={shape.ry}
          fill={shape.fill}
          transform={shape.rotate ? `rotate(${shape.rotate} ${shape.cx} ${shape.cy})` : undefined}
        />
      );

    case 'rect':
      return (
        <rect
          key={key}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          rx={shape.rx}
          fill={shape.fill}
          transform={
            shape.rotate
              ? `rotate(${shape.rotate} ${shape.x + shape.width / 2} ${shape.y + shape.height / 2})`
              : undefined
          }
        />
      );

    case 'path':
      return (
        <path
          key={key}
          d={shape.d}
          fill={shape.fill ?? 'none'}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );

    case 'ring':
      return (
        <circle
          key={key}
          cx={shape.cx}
          cy={shape.cy}
          r={shape.r}
          fill="none"
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
        />
      );

    default:
      return null;
  }
}

export default function MascotAvatar({
  avatar,
  size = 40,
  className = '',
  bordered = false,
  title,
}: MascotAvatarProps) {
  const config = normalizeAvatar(avatar);
  const shapes = buildAvatarShapes(config);
  const label = title ?? describeAvatar(config);

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className={`${bordered ? 'rounded-full ring-1 ring-rule' : ''} shrink-0 ${className}`.trim()}
    >
      <title>{label}</title>
      {/* The backdrop is already a rounded rect, so clipping keeps stray
          strokes (antlers, horns, a crown) from spilling past the circle. */}
      <defs>
        <clipPath id={`mascot-clip-${config.character}-${config.color}-${config.background}-${config.accessory}`}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>
      <g
        clipPath={`url(#mascot-clip-${config.character}-${config.color}-${config.background}-${config.accessory})`}
      >
        {shapes.map(renderShape)}
      </g>
    </svg>
  );
}
