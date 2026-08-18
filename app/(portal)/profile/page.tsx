import { PageHeader } from "@/components/layout/page-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { getOwnProfile } from "@/lib/actions/profile";

export default async function ProfilePage() {
  const profile = await getOwnProfile();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="My profile" description="View and update your profile information and password." />
      <ProfileForm profile={profile} />
      <ChangePasswordForm />
    </div>
  );
}
