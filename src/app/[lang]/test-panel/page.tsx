// This is now a Server Component
import TestPanelClient from './TestPanelClient' // Import the new client component

// generateStaticParams remains here to define static paths
export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'de' }]
}

// The page component now just renders the client component
export default function TestPanelPage() {
  return <TestPanelClient />
}
