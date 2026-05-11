// Gift DN-AI — ImagePlaceholder shared component
import { TONE_BG } from "@/lib/data";

interface ImagePlaceholderProps {
  tone?: string;
  label?: string;
  h?: number;
  style?: React.CSSProperties;
}

export default function ImagePlaceholder({ tone = "sage", label, h = 240, style = {} }: ImagePlaceholderProps) {
  return (
    <div
      className="placeholder-image"
      style={{ background: TONE_BG[tone] || tone, height: h, ...style }}
    >
      {label && <span className="label">{label}</span>}
    </div>
  );
}
