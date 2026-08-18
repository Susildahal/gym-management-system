import { PageHeader } from "@/components/layout/page-header";
import { SettingsForm } from "@/components/settings/settings-form";
import { getSettings } from "@/lib/actions/settings";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div>
      <PageHeader title="Settings" description="Academy configuration, branding, and system preferences." />
      <SettingsForm settings={settings} />
    </div>
  );
}
