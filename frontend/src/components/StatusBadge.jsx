export default function StatusBadge({ status }) {
  const statusMap = {
    REGISTERED: 'badge-registered',
    TRANSFERRED: 'badge-transferred',
    IN_TRANSIT: 'badge-in-transit',
    DELIVERED: 'badge-delivered',
  };
  const className = statusMap[status] || 'badge-registered';
  return <span className={`badge ${className}`}>{status}</span>;
}
