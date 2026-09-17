import { useEffect, useState } from 'react';
import { useAuth } from '../../app/providers/AuthProvider';
import { useToast } from '../../app/providers/ToastProvider';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';

function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-soft)' }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = { borderColor: 'var(--line)', background: 'var(--surface)', color: 'var(--ink)' };

export default function EditProfilePage() {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (user) setForm({ username: user.username, bio: user.bio || '', region: user.region || '', visibility: 'public' });
  }, [user]);

  if (!form) return <LoadingState label="Loading profile" />;

  function save() {
    // Backend doesn't yet expose a profile-update endpoint — mocked per spec §PAGE 14.
    toast('Profile updated');
  }

  return (
    <div className="px-4 pb-10 pt-2 md:px-0">
      <div
        className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border font-display text-2xl font-bold"
        style={{ background: 'var(--surface-alt)', borderColor: 'var(--line)', color: 'var(--ink-soft)' }}
      >
        {user?.avatarInitials}
      </div>

      <Field label="Username">
        <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full rounded-sm border px-3 py-2.5 text-sm" style={inputStyle} />
      </Field>
      <Field label="Bio">
        <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className="w-full rounded-sm border px-3 py-2.5 text-sm" style={inputStyle} />
      </Field>
      <Field label="Region">
        <input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="w-full rounded-sm border px-3 py-2.5 text-sm" style={inputStyle} />
      </Field>
      <Field label="Profile visibility">
        <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })} className="w-full rounded-sm border px-3 py-2.5 text-sm" style={inputStyle}>
          <option value="public">Public</option>
          <option value="friends">Friends only</option>
          <option value="private">Private</option>
        </select>
      </Field>

      <div className="mt-6 flex gap-2">
        <Button onClick={save}>Save changes</Button>
        <Button variant="secondary">Cancel</Button>
      </div>
    </div>
  );
}
