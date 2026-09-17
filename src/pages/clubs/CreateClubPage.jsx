import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { data as realData } from '../../services/dataService';
import { useToast } from '../../app/providers/ToastProvider';
import { DEMO_MODE } from '../../config/env';
import Button from '../../components/common/Button';
import Panel from '../../components/common/Panel';

const inputStyle = { borderColor: 'var(--line)', background: 'var(--surface)', color: 'var(--ink)' };

export default function CreateClubPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    if (name.trim().length < 3) return setError('Club name must be at least 3 characters');
    setError(null);

    if (DEMO_MODE) {
      toast('Demo mode — connect a real backend to create clubs', 'info');
      return navigate('/clubs');
    }

    setSubmitting(true);
    try {
      const club = await realData.createClub({ name, description, visibility });
      toast('Club created', 'success');
      navigate(`/clubs/${club.id}`);
    } catch (err) {
      setError(err.message || 'Could not create this club');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-10 pt-4">
      <h1 className="mb-5 font-display text-lg font-bold">Create a club</h1>

      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-soft)' }}>Name</label>
      <input value={name} onChange={(e) => setName(e.target.value)} className="mb-4 w-full rounded-sm border px-3 py-2.5 text-sm" style={inputStyle} placeholder="e.g. Night Owls Chess Club" />

      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-soft)' }}>Description</label>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mb-4 w-full rounded-sm border px-3 py-2.5 text-sm" style={inputStyle} />

      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-soft)' }}>Visibility</label>
      <div className="mb-6 flex gap-2">
        {['public', 'private'].map((v) => (
          <button key={v} onClick={() => setVisibility(v)} className="flex-1 rounded-sm border py-2.5 text-sm font-bold capitalize"
            style={{ borderColor: visibility === v ? 'var(--accent)' : 'var(--line)', background: visibility === v ? 'var(--accent-tint)' : 'var(--surface)' }}>
            {v}
          </button>
        ))}
      </div>

      <Panel className="mb-4 p-4 text-center">
        <div className="font-display text-base font-bold">{name || 'Your club name'}</div>
        <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>{description || 'A short description will appear here'}</div>
      </Panel>

      {error && <div className="mb-4 rounded-sm px-3 py-2.5 text-center text-sm font-semibold" style={{ background: 'var(--loss-tint)', color: 'var(--loss)' }}>{error}</div>}

      <Button className="w-full !py-3.5" onClick={handleCreate} disabled={submitting}>
        {submitting ? 'Creating…' : 'Create club'}
      </Button>
    </div>
  );
}
