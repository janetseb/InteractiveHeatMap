export default function RatingBar({ label, value, max = 5, color = '#0EA5E9' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
      <span style={{ fontSize: 12, color: '#94a3b8', width: 110 }}>{label}</span>
      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: max }).map((_, i) => (
          <div key={i} style={{
            width: 16, height: 6, borderRadius: 3,
            background: i < value ? color : 'rgba(0,0,0,0.08)',
          }} />
        ))}
      </div>
    </div>
  )
}