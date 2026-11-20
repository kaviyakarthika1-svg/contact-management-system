import { useState } from 'react';
import Icon from '../ui/Icon';
import EmptyState from '../ui/EmptyState';
import { contactService } from '../../services/contactService';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { timeAgo } from '../../utils/dateUtils';

/**
 * Notes panel for the contact details page: add / edit / delete notes.
 */
export default function NoteSection({ contact }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const notes = contact.notes || [];

  function handleAdd(event) {
    event.preventDefault();
    if (!draft.trim()) return;
    contactService.addNote(contact.id, draft);
    setDraft('');
    toast.success('Note added');
  }

  function startEdit(noteItem) {
    setEditingId(noteItem.id);
    setEditingText(noteItem.text);
  }

  function saveEdit(noteId) {
    if (!editingText.trim()) return;
    contactService.updateNote(contact.id, noteId, editingText);
    setEditingId(null);
    toast.success('Note updated');
  }

  async function handleDelete(noteItem) {
    const ok = await confirm({
      title: 'Delete note?',
      message: 'This note will be removed permanently.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    contactService.deleteNote(contact.id, noteItem.id);
    toast.success('Note deleted');
  }

  return (
    <div className="notes">
      <form className="notes__form" onSubmit={handleAdd}>
        <label className="visually-hidden" htmlFor="new-note">
          Add a note
        </label>
        <textarea
          id="new-note"
          className="input textarea"
          rows={2}
          placeholder="Add a note… e.g. “Discussed final year project.”"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={!draft.trim()}>
          <Icon name="plus" size={14} /> Add note
        </button>
      </form>

      {notes.length === 0 ? (
        <EmptyState icon="note" title="No notes yet" message="Keep track of conversations, ideas and follow-ups here." />
      ) : (
        <ul className="notes__list">
          {notes.map((noteItem) => (
            <li key={noteItem.id} className="note">
              {editingId === noteItem.id ? (
                <div className="note__edit">
                  <textarea
                    className="input textarea"
                    rows={3}
                    value={editingText}
                    onChange={(event) => setEditingText(event.target.value)}
                    aria-label="Edit note"
                  />
                  <div className="note__actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => saveEdit(noteItem.id)}>
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="note__text">{noteItem.text}</p>
                  <div className="note__footer">
                    <span className="note__time">{timeAgo(noteItem.createdAt)}</span>
                    <div className="note__actions">
                      <button type="button" className="icon-btn" aria-label="Edit note" onClick={() => startEdit(noteItem)}>
                        <Icon name="edit" size={14} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn--danger"
                        aria-label="Delete note"
                        onClick={() => handleDelete(noteItem)}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
