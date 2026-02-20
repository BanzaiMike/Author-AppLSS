import { AccountUI } from "@/app/_components/account-ui";

export default async function AppAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; delete?: string }>;
}) {
  const { message, delete: deleteRaw } = await searchParams;
  return (
    <AccountUI
      messageParam={message ?? null}
      deleteParam={deleteRaw ?? null}
    />
  );
}
