import { avatarColor, fullName, initials } from '../../utils/contactUtils';

/**
 * Circular avatar: shows the uploaded photo when available, otherwise
 * colored initials derived from the contact's name.
 */
export default function Avatar({ contact, size = 44, className = '' }) {
  const name = fullName(contact);
  const style = {
    width: size,
    height: size,
    fontSize: Math.max(11, Math.round(size * 0.36)),
    backgroundColor: contact?.avatar ? 'transparent' : avatarColor(name),
  };

  if (contact?.avatar) {
    return (
      <span className={`avatar avatar--photo ${className}`.trim()} style={style}>
        <img src={contact.avatar} alt={`${name}'s profile`} loading="lazy" />
      </span>
    );
  }

  return (
    <span className={`avatar ${className}`.trim()} style={style} aria-hidden="true">
      {initials(contact)}
    </span>
  );
}
