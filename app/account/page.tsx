import { redirect } from "next/navigation";

export default async function AccountRedirect({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        qs.append(key, v);
      }
    } else if (value !== undefined) {
      qs.set(key, value);
    }
  }

  const queryString = qs.toString();
  redirect(`/app/account${queryString ? `?${queryString}` : ""}`);
}
