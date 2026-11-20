import { useRef, useState } from 'react';
import Modal from '../ui/Modal';
import Icon from '../ui/Icon';
import { csvToContacts, readTextFile } from '../../services/csvService';
import { contactService } from '../../services/contactService';
import { groupService } from '../../services/groupService';
import { useToast } from '../../context/ToastContext';

/**
 * CSV import wizard: pick file → preview valid/invalid rows → import.
 * Invalid rows are reported (never crash); duplicates are skipped.
 */
export default function ImportModal({ open, onClose }) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState(null);
  const [parseError, setParseError] = useState('');
  const [busy, setBusy] = useState(false);

  function reset() {
    setFileName('');
    setParsed(null);
    setParseError('');
    setBusy(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/\.(csv|txt)$/i.test(file.name)) {
      setParseError('Please choose a .csv file.');
      setParsed(null);
      return;
    }
    setFileName(file.name);
    setParseError('');
    try {
      const text = await readTextFile(file);
      const result = csvToContacts(text);
      if (result.error) {
        setParseError(result.error);
        setParsed(null);
      } else {
        setParsed(result);
      }
    } catch {
      setParseError('Could not read that file. Try again.');
      setParsed(null);
    }
  }

  function resolveGroupId(groupName) {
    if (!groupName) return '';
    const existing = groupService.getAll().find((g) => g.name.toLowerCase() === groupName.toLowerCase());
    return existing ? existing.id : groupService.add(groupName).id;
  }

  function handleImport() {
    if (!parsed || parsed.rows.length === 0) return;
    setBusy(true);
    try {
      // Map group names to ids (creating new groups when needed).
      const rows = parsed.rows.map((row) => ({ ...row, groupId: resolveGroupId(row.group) }));
      const summary = contactService.importContacts(rows);
      toast.success(
        `Imported ${summary.added} contact${summary.added === 1 ? '' : 's'}`,
        [
          summary.duplicates.length ? `${summary.duplicates.length} duplicate(s) skipped` : null,
          summary.invalid.length ? `${summary.invalid.length} invalid row(s) ignored` : null,
        ]
          .filter(Boolean)
          .join(' · ') || 'All rows imported successfully.',
      );
      handleClose();
    } catch {
      toast.error('Import failed', 'Something went wrong while importing. No changes were made.');
    } finally {
      setBusy(false);
    }
  }

  const total = parsed ? parsed.rows.length + parsed.invalid.length : 0;

  return (
    <Modal open={open} onClose={handleClose} title="Import contacts from CSV" width={560}>
      <div className="import">
        <p className="import__hint">
          Expected columns: <code>firstName, lastName, phone, email, company, group, tags…</code> A single{' '}
          <code>name</code> column also works. Invalid rows are reported, never crash the import.
        </p>

        <label className={`import__dropzone ${fileName ? 'has-file' : ''}`.trim()}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            className="visually-hidden"
          />
          <Icon name="upload" size={22} />
          <span className="import__dropzone-text">
            {fileName ? fileName : 'Click to choose a CSV file'}
          </span>
        </label>

        {parseError ? (
          <p className="import__error" role="alert">
            <Icon name="alert-triangle" size={15} /> {parseError}
          </p>
        ) : null}

        {parsed ? (
          <div className="import__summary">
            <p>
              <strong>{parsed.rows.length}</strong> valid row{parsed.rows.length === 1 ? '' : 's'}
              {parsed.invalid.length ? (
                <>
                  {' '}· <strong className="text-danger">{parsed.invalid.length}</strong> invalid
                </>
              ) : null}{' '}
              of {total}
            </p>
            {parsed.invalid.length > 0 ? (
              <div className="import__invalid">
                <table>
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Name</th>
                      <th>Problem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.invalid.slice(0, 8).map((item) => (
                      <tr key={item.row}>
                        <td>#{item.row}</td>
                        <td>{item.name}</td>
                        <td>{item.errors.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.invalid.length > 8 ? <p>…and {parsed.invalid.length - 8} more.</p> : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="modal__footer">
          <button type="button" className="btn btn-ghost" onClick={handleClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!parsed || parsed.rows.length === 0 || busy}
            onClick={handleImport}
          >
            <Icon name="download" size={15} />
            {busy ? 'Importing…' : `Import ${parsed ? parsed.rows.length : ''} contacts`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
