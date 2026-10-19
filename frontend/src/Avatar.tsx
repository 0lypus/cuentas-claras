export function Avatar({ nombre }: { nombre: string }) {
  const hue = [...nombre].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <span className="avatar" style={{ background: `hsl(${hue} 45% 40%)` }}>
      {nombre.charAt(0).toUpperCase()}
    </span>
  );
}
