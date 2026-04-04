import { redirect } from 'next/navigation'

/**
 * Legacy profile route — redirects to /u/[username]
 */
export default async function LegacyProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  redirect(`/u/${username}`)
}
