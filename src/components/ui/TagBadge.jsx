/** Small colored chip used for contact tags. Renders `children` when given. */
export default function TagBadge({ tag, active = false, onClick, title, children }) {
  const className = `tag ${active ? 'tag--active' : ''}`.trim();
  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick} title={title || `Filter by "${tag}"`}>
        {children || tag}
      </button>
    );
  }
  return (
    <span className={className} title={title}>
      {children || tag}
    </span>
  );
}
