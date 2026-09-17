import EmptyState from '../../components/common/EmptyState';

// Desktop shows this alongside the settings list (SettingsLayout master-detail);
// mobile never sees this — the list itself is the index route there.
export default function SettingsIndexPage() {
  return <EmptyState icon="⚙" title="Choose a category" description="Pick a settings category from the list to get started." />;
}
