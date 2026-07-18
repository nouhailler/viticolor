import { useRef } from 'react';

/**
 * Emplacement photo — remplace le composant `image-slot` du prototype.
 * Accepte une prise de vue caméra ou un fichier ; renvoie une data URL.
 */
export function PhotoSlot({
  value,
  onChange,
  width,
  height,
  placeholder = 'Photo',
  radius = 4,
}: {
  value?: string;
  onChange: (dataUrl: string) => void;
  width: number | string;
  height: number | string;
  placeholder?: string;
  radius?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      style={{
        width,
        height,
        borderRadius: radius,
        border: value ? 'none' : '1px dashed var(--gold-border)',
        background: value ? `center/cover no-repeat url(${value})` : 'var(--surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        overflow: 'hidden',
        color: 'var(--text-muted)',
        fontSize: 11,
        letterSpacing: '1px',
        textTransform: 'uppercase',
        flexShrink: 0,
      }}
    >
      {!value && placeholder}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => pick(e.target.files?.[0])}
        style={{ display: 'none' }}
      />
    </div>
  );
}
