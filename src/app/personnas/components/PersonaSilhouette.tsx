// 6 abstract head silhouette shapes, rendered as SVG with 3D gradient depth.
// Shapes: 0=round, 1=oval, 2=square jaw, 3=wide cheeks, 4=diamond chin, 5=petite

const SHAPES = [
  // 0: Classic round face
  "M32,7 C52,7 58,20 58,34 C58,48 50,58 38,61 L38,67 C50,68 58,72 64,72 L0,72 C6,72 14,68 26,67 L26,61 C14,58 6,48 6,34 C6,20 12,7 32,7Z",
  // 1: Oval / elongated narrow
  "M32,4 C47,4 54,16 54,32 C54,48 47,61 37,63 L37,68 C47,69 56,72 64,72 L0,72 C8,72 17,69 27,68 L27,63 C17,61 10,48 10,32 C10,16 17,4 32,4Z",
  // 2: Square / strong angular jaw
  "M32,9 C51,9 58,20 58,34 C58,44 55,52 47,58 L44,65 C56,67 62,72 64,72 L0,72 C2,72 8,67 20,65 L17,58 C9,52 6,44 6,34 C6,20 13,9 32,9Z",
  // 3: Wide / prominent cheeks
  "M32,10 C56,10 62,23 62,37 C62,50 53,59 40,62 L40,67 C52,68 60,72 64,72 L0,72 C4,72 12,68 24,67 L24,62 C11,59 2,50 2,37 C2,23 8,10 32,10Z",
  // 4: Diamond / tapered pointed chin
  "M32,7 C50,7 58,18 58,33 C58,44 53,53 44,58 C40,61 36,65 32,69 C28,65 24,61 20,58 C11,53 6,44 6,33 C6,18 14,7 32,7Z M29,67 L26,67 C14,69 5,71 0,72 L64,72 C59,71 50,69 38,67 L35,67Z",
  // 5: Petite / compact smaller head
  "M32,8 C45,8 52,17 52,30 C52,43 45,53 35,56 L35,63 C45,64 55,69 64,72 L0,72 C9,69 19,64 29,63 L29,56 C19,53 12,43 12,30 C12,17 19,8 32,8Z",
];

interface PersonaSilhouetteProps {
  shapeIndex: number;
  color1: string;
  color2: string;
  uid: string;
  size?: number;
}

export function PersonaSilhouette({
  shapeIndex,
  color1,
  color2,
  uid,
  size = 64,
}: PersonaSilhouetteProps) {
  const pathData = SHAPES[shapeIndex % SHAPES.length];
  const safeUid = uid.replace(/[^a-z0-9]/gi, "").slice(0, 24);
  const gradId = `sg-${safeUid}`;
  const hlId = `sh-${safeUid}`;
  const height = Math.round(size * 72 / 64);

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 64 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={gradId} x1="10" y1="4" x2="54" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={color1} />
          <stop offset="100%" stopColor={color2} />
        </linearGradient>
        <radialGradient id={hlId} cx="40%" cy="26%" r="48%">
          <stop offset="0%" stopColor="white" stopOpacity="0.38" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={pathData} fill={`url(#${gradId})`} />
      <path d={pathData} fill={`url(#${hlId})`} />
    </svg>
  );
}
