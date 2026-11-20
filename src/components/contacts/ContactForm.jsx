import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Field from '../ui/Field';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import TagBadge from '../ui/TagBadge';
import { useContacts, useGroups } from '../../hooks/useData';
import { contactService } from '../../services/contactService';
import { fullName } from '../../utils/contactUtils';
import { isValidEmail, isValidPhone, isValidWebsite } from '../../utils/validators';
import { RELATIONSHIPS, TAG_SUGGESTIONS } from '../../utils/constants';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  phone: '',
  altPhone: '',
  email: '',
  company: '',
  jobTitle: '',
  address: '',
  city: '',
  website: '',
  birthday: '',
  groupId: '',
  relationship: '',
  tags: [],
  avatar: null,
  favorite: false,
  important: false,
};

/**
 * Shared form for Add Contact and Edit Contact.
 * Validates input, blocks duplicate phone/email (with a "save anyway" escape
 * hatch) and supports an optional profile photo (resized to keep localStorage
 * small). Calls `onSubmit(values)` when the form is valid.
 */
export default function ContactForm({ initial = null, isEdit = false, onSubmit, onCancel }) {
  const contacts = useContacts();
  const groups = useGroups();

  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    ...(initial
      ? {
          ...initial,
          tags: [...(initial.tags || [])],
          notes: undefined, // notes are managed on the details page
        }
      : {}),
  }));
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const avatarInputRef = useRef(null);

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  const groupOptions = useMemo(() => [...groups].sort((a, b) => a.name.localeCompare(b.name)), [groups]);

  /* ----------------------------- Tags ----------------------------- */
  function addTag(raw) {
    const tag = raw.trim().replace(/^#/, '');
    if (!tag) return;
    if (form.tags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setTagInput('');
      return;
    }
    set({ tags: [...form.tags, tag] });
    setTagInput('');
  }

  function removeTag(tag) {
    set({ tags: form.tags.filter((t) => t !== tag) });
  }

  /* ----------------------------- Avatar ----------------------------- */
  function handleAvatarFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, avatar: 'Please choose an image file.' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Downscale to max 256px so the data URL stays small in localStorage.
        const maxSize = 256;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        set({ avatar: canvas.toDataURL('image/jpeg', 0.82) });
        setErrors((prev) => ({ ...prev, avatar: undefined }));
      };
      img.onerror = () => setErrors((prev) => ({ ...prev, avatar: 'That image could not be read.' }));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  /* --------------------------- Validation --------------------------- */
  function validate() {
    const next = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required';
    if (!form.lastName.trim()) next.lastName = 'Last name is required';
    if (!form.phone.trim()) next.phone = 'Phone number is required';
    else if (!isValidPhone(form.phone)) next.phone = 'Enter a valid phone number (7–15 digits)';
    if (form.email && !isValidEmail(form.email)) next.email = 'Enter a valid email address';
    if (form.website && !isValidWebsite(form.website)) next.website = 'Enter a valid website URL';
    if (form.birthday) {
      const today = new Date().toISOString().slice(0, 10);
      if (form.birthday > today) next.birthday = 'Birthday cannot be in the future';
    }
    if (form.altPhone && !isValidPhone(form.altPhone)) next.altPhone = 'Enter a valid phone number';
    return next;
  }

  function checkDuplicates(exceptId = null) {
    return contactService.findDuplicates({ phone: form.phone, email: form.email }, exceptId);
  }

  function handleSubmit(event) {
    event.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      const firstError = document.querySelector('.field--error input, .field--error textarea');
      firstError?.focus();
      return;
    }

    // Duplicate phone/email check (skipped when the user already confirmed).
    const dupes = checkDuplicates(isEdit ? initial?.id : null);
    if (dupes.length > 0 && duplicateWarning === null) {
      setDuplicateWarning(dupes);
      return;
    }

    onSubmit({
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
    });
  }

  function reset() {
    setForm(() => ({ ...EMPTY_FORM }));
    setErrors({});
    setDuplicateWarning(null);
    setTagInput('');
  }

  return (
    <form className="form contact-form" onSubmit={handleSubmit} noValidate>
      {duplicateWarning ? (
        <div className="duplicate-warning" role="alert">
          <p className="duplicate-warning__title">
            <Icon name="alert-triangle" size={16} /> Possible duplicate contact
          </p>
          <p className="duplicate-warning__text">
            These existing contacts share the same phone number or email:
          </p>
          <ul className="duplicate-warning__list">
            {duplicateWarning.map((dupe) => (
              <li key={dupe.id}>
                <Link to={`/contacts/${dupe.id}`}>
                  {fullName(dupe)} · {dupe.phone}
                </Link>
              </li>
            ))}
          </ul>
          <div className="duplicate-warning__actions">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                setDuplicateWarning(null);
                setForm((current) => ({ ...current }));
              }}
            >
              Go back and edit
            </button>
            <button type="submit" className="btn btn-warning btn-sm">
              Save anyway
            </button>
          </div>
        </div>
      ) : null}

      <div className="contact-form__identity">
        <div className="contact-form__avatar">
          {form.avatar ? (
            <span className="avatar avatar--photo" style={{ width: 72, height: 72 }}>
              <img src={form.avatar} alt="Profile preview" />
            </span>
          ) : (
            <Avatar contact={{ firstName: form.firstName, lastName: form.lastName }} size={72} />
          )}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="visually-hidden"
            onChange={handleAvatarFile}
            aria-label="Upload profile photo"
          />
          <div className="contact-form__avatar-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => avatarInputRef.current?.click()}>
              <Icon name="upload" size={13} /> Upload
            </button>
            {form.avatar ? (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => set({ avatar: null })}>
                Remove
              </button>
            ) : null}
          </div>
        </div>
        <div className="contact-form__identity-fields">
          <div className="form__grid form__grid--2">
            <Field id="firstName" label="First name" required error={errors.firstName}>
              <input
                id="firstName"
                className="input"
                type="text"
                autoComplete="given-name"
                placeholder="e.g. Aarav"
                value={form.firstName}
                onChange={(event) => set({ firstName: event.target.value })}
              />
            </Field>
            <Field id="lastName" label="Last name" required error={errors.lastName}>
              <input
                id="lastName"
                className="input"
                type="text"
                autoComplete="family-name"
                placeholder="e.g. Sharma"
                value={form.lastName}
                onChange={(event) => set({ lastName: event.target.value })}
              />
            </Field>
          </div>
        </div>
      </div>

      <fieldset className="form__fieldset">
        <legend className="form__legend">Contact details</legend>
        <div className="form__grid form__grid--2">
          <Field id="phone" label="Phone number" required error={errors.phone}>
            <input
              id="phone"
              className="input"
              type="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={(event) => set({ phone: event.target.value })}
            />
          </Field>
          <Field id="altPhone" label="Alternate phone" error={errors.altPhone}>
            <input
              id="altPhone"
              className="input"
              type="tel"
              placeholder="Optional"
              value={form.altPhone}
              onChange={(event) => set({ altPhone: event.target.value })}
            />
          </Field>
          <Field id="email" label="Email" error={errors.email}>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={(event) => set({ email: event.target.value })}
            />
          </Field>
          <Field id="website" label="Website" error={errors.website}>
            <input
              id="website"
              className="input"
              type="url"
              placeholder="https://…"
              value={form.website}
              onChange={(event) => set({ website: event.target.value })}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="form__fieldset">
        <legend className="form__legend">Work &amp; location</legend>
        <div className="form__grid form__grid--2">
          <Field id="company" label="Company">
            <input
              id="company"
              className="input"
              type="text"
              placeholder="e.g. TechNova Solutions"
              value={form.company}
              onChange={(event) => set({ company: event.target.value })}
            />
          </Field>
          <Field id="jobTitle" label="Job title">
            <input
              id="jobTitle"
              className="input"
              type="text"
              placeholder="e.g. Software Engineer"
              value={form.jobTitle}
              onChange={(event) => set({ jobTitle: event.target.value })}
            />
          </Field>
        </div>
        <div className="form__grid form__grid--2">
          <Field id="address" label="Address">
            <input
              id="address"
              className="input"
              type="text"
              placeholder="Street / area"
              value={form.address}
              onChange={(event) => set({ address: event.target.value })}
            />
          </Field>
          <Field id="city" label="City">
            <input
              id="city"
              className="input"
              type="text"
              placeholder="e.g. Bengaluru"
              value={form.city}
              onChange={(event) => set({ city: event.target.value })}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="form__fieldset">
        <legend className="form__legend">Organisation</legend>
        <div className="form__grid form__grid--2">
          <Field id="birthday" label="Birthday" error={errors.birthday} hint="Shown in the dashboard countdown.">
            <input
              id="birthday"
              className="input"
              type="date"
              value={form.birthday}
              onChange={(event) => set({ birthday: event.target.value })}
            />
          </Field>
          <Field id="relationship" label="Relationship">
            <select
              id="relationship"
              className="input select"
              value={form.relationship}
              onChange={(event) => set({ relationship: event.target.value })}
            >
              <option value="">Not set</option>
              {RELATIONSHIPS.map((relationship) => (
                <option key={relationship} value={relationship}>
                  {relationship}
                </option>
              ))}
            </select>
          </Field>
          <Field id="groupId" label="Group">
            <select
              id="groupId"
              className="input select"
              value={form.groupId}
              onChange={(event) => set({ groupId: event.target.value })}
            >
              <option value="">No group</option>
              {groupOptions.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="field">
            <span className="field__label">Flags</span>
            <div className="field__toggles">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={form.favorite}
                  onChange={(event) => set({ favorite: event.target.checked })}
                />
                <Icon name="star" size={14} /> Favorite
              </label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={form.important}
                  onChange={(event) => set({ important: event.target.checked })}
                />
                <Icon name="shield" size={14} /> Important
              </label>
            </div>
          </div>
        </div>

        <Field id="tags" label="Tags" hint="Press Enter to add. Suggestions: VIP, Urgent, Client, Project…">
          <div className="tags-input">
            {form.tags.map((tag) => (
              <TagBadge key={tag} tag={tag} title="Remove tag">
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Remove tag ${tag}`}
                  onClick={() => removeTag(tag)}
                  onKeyDown={(event) => event.key === 'Enter' && removeTag(tag)}
                  className="tag__remove"
                >
                  ×
                </span>
              </TagBadge>
            ))}
            <input
              id="tags"
              className="tags-input__field"
              type="text"
              list="tag-suggestions"
              placeholder={form.tags.length ? 'Add another…' : 'e.g. VIP'}
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addTag(tagInput);
                } else if (event.key === 'Backspace' && !tagInput && form.tags.length) {
                  removeTag(form.tags[form.tags.length - 1]);
                }
              }}
            />
            <datalist id="tag-suggestions">
              {TAG_SUGGESTIONS.map((tag) => (
                <option key={tag} value={tag} />
              ))}
            </datalist>
          </div>
        </Field>
      </fieldset>

      <div className="modal__footer contact-form__footer">
        {!isEdit ? (
          <button type="button" className="btn btn-ghost" onClick={reset}>
            <Icon name="refresh" size={14} /> Reset
          </button>
        ) : null}
        <span className="contact-form__spacer" />
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          <Icon name="check" size={15} />
          {isEdit ? 'Save changes' : 'Save contact'}
        </button>
      </div>
    </form>
  );
}
