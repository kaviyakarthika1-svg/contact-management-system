import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import Modal from '../components/ui/Modal';
import Field from '../components/ui/Field';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import { useContacts, useGroups, useSkeleton, useTitle } from '../hooks/useData';
import { groupService } from '../services/groupService';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { GROUP_COLORS } from '../utils/constants';

const COLOR_CHOICES = GROUP_COLORS;

/** /groups — create, rename, delete groups and view their contacts. */
export default function GroupsPage() {
  useTitle('Groups');
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const loading = useSkeleton();

  const groups = useGroups();
  const contacts = useContacts();

  const [modal, setModal] = useState(null); // { mode: 'add'|'edit', group? }
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_CHOICES[0]);
  const [error, setError] = useState('');

  const counts = useMemo(() => groupService.countContacts(contacts), [contacts]);

  function openAdd() {
    setName('');
    setColor(COLOR_CHOICES[0]);
    setError('');
    setModal({ mode: 'add' });
  }

  function openEdit(group) {
    setName(group.name);
    setColor(group.color);
    setError('');
    setModal({ mode: 'edit', group });
  }

  function handleSave(event) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Group name is required');
      return;
    }
    const duplicate = groups.some(
      (g) => g.name.toLowerCase() === trimmed.toLowerCase() && g.id !== modal?.group?.id,
    );
    if (duplicate) {
      setError('A group with that name already exists');
      return;
    }
    if (modal.mode === 'edit') {
      groupService.rename(modal.group.id, trimmed);
      toast.success('Group renamed', trimmed);
    } else {
      groupService.add(trimmed, color);
      toast.success('Group created', trimmed);
    }
    setModal(null);
  }

  async function handleDelete(group) {
    const memberCount = counts[group.id] || 0;
    const ok = await confirm({
      title: `Delete "${group.name}"?`,
      message: memberCount
        ? `${memberCount} contact${memberCount === 1 ? '' : 's'} will be moved to "No group".`
        : 'This group has no members and will be removed.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    groupService.remove(group.id);
    toast.success('Group deleted', group.name);
  }

  if (loading) {
    return (
      <div className="page">
        <Skeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Groups</h1>
          <p className="page-subtitle">{groups.length} group{groups.length === 1 ? '' : 's'} to organise your contacts</p>
        </div>
        <div className="page-header__actions">
          <button type="button" className="btn btn-primary" onClick={openAdd}>
            <Icon name="folder-plus" size={15} /> Create group
          </button>
        </div>
      </header>

      {groups.length === 0 ? (
        <EmptyState
          icon="folder"
          title="No groups yet"
          message="Create groups like Family, Work or Clients to organise your contacts."
        >
          <button type="button" className="btn btn-primary" onClick={openAdd}>
            <Icon name="folder-plus" size={15} /> Create your first group
          </button>
        </EmptyState>
      ) : (
        <div className="group-grid">
          {groups.map((group) => {
            const memberCount = counts[group.id] || 0;
            return (
              <article key={group.id} className="group-card" style={{ '--group-color': group.color }}>
                <div className="group-card__top">
                  <span className="group-card__icon" aria-hidden="true">
                    <Icon name="folder" size={18} />
                  </span>
                  <div className="group-card__actions">
                    <button type="button" className="icon-btn" aria-label={`Rename ${group.name}`} onClick={() => openEdit(group)}>
                      <Icon name="edit" size={15} />
                    </button>
                    <button type="button" className="icon-btn icon-btn--danger" aria-label={`Delete ${group.name}`} onClick={() => handleDelete(group)}>
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                </div>
                <h2 className="group-card__name">{group.name}</h2>
                <p className="group-card__count">
                  {memberCount} member{memberCount === 1 ? '' : 's'}
                </p>
                <div className="group-card__footer">
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate(`/contacts?group=${group.id}`)}>
                    <Icon name="users" size={13} /> View contacts
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal open={Boolean(modal)} onClose={() => setModal(null)} title={modal?.mode === 'edit' ? 'Rename group' : 'Create group'} width={420}>
        <form className="form" onSubmit={handleSave} noValidate>
          <Field id="group-name" label="Group name" required error={error}>
            <input
              id="group-name"
              className="input"
              type="text"
              placeholder="e.g. Family"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError('');
              }}
              autoFocus
            />
          </Field>
          <div className="field">
            <span className="field__label">Colour</span>
            <div className="color-picker" role="radiogroup" aria-label="Group colour">
              {COLOR_CHOICES.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  role="radio"
                  aria-checked={color === choice}
                  className={`color-picker__swatch ${color === choice ? 'color-picker__swatch--active' : ''}`.trim()}
                  style={{ backgroundColor: choice }}
                  onClick={() => setColor(choice)}
                  aria-label={`Colour ${choice}`}
                />
              ))}
            </div>
          </div>
          <div className="modal__footer">
            <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {modal?.mode === 'edit' ? 'Save changes' : 'Create group'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
