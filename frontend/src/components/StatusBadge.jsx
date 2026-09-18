export default function StatusBadge({ status, isGenesis = false }) {
  if (isGenesis) {
    return (
      <span className="badge badge-genesis">
        <span className="badge-dot"></span>
        GENESIS SEED
      </span>
    );
  }

  const statusConfig = {
    REGISTERED: { class: 'badge-registered', label: 'REGISTERED' },
    TRANSFERRED: { class: 'badge-transferred', label: 'TRANSFERRED' },
    IN_TRANSIT: { class: 'badge-transit', label: 'IN TRANSIT' },
    DELIVERED: { class: 'badge-delivered', label: 'DELIVERED' },
  };

  const config = statusConfig[status] || { class: 'badge-default', label: status || 'UNKNOWN' };

  return (
    <span className={`badge ${config.class}`}>
      <span className="badge-dot"></span>
      {config.label}
    </span>
  );
}
