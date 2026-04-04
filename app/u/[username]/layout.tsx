import type { Metadata } from 'next'
import { getDb } from '@/lib/db'

interface Props {
  params: Promise<{ username: string }>
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params

  try {
    const sql = getDb()
    const rows = await sql`
      SELECT username, display_name, bio, avatar_url, tools_created
      FROM users WHERE username = ${username}
    ` as Record<string, unknown>[]

    const user = rows[0]
    if (!user) {
      return { title: 'Creator Not Found — AgentDoom' }
    }

    const displayName = (user.display_name as string) || (user.username as string)
    const bio = (user.bio as string) || `Check out ${displayName}'s tools on AgentDoom`
    const toolCount = user.tools_created as number
    const title = `${displayName} (@${user.username}) — AgentDoom`
    const description = `${bio} | ${toolCount} tool${toolCount !== 1 ? 's' : ''} published`
    const profileUrl = `https://agentdoom.ai/u/${user.username}`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: profileUrl,
        siteName: 'AgentDoom',
        type: 'profile',
        ...(user.avatar_url ? { images: [{ url: user.avatar_url as string, width: 400, height: 400 }] } : {}),
      },
      twitter: {
        card: 'summary',
        title,
        description,
        ...(user.avatar_url ? { images: [user.avatar_url as string] } : {}),
      },
      alternates: {
        canonical: profileUrl,
      },
    }
  } catch {
    return { title: 'Creator — AgentDoom' }
  }
}

export default function ProfileLayout({ children }: Props) {
  return <>{children}</>
}
