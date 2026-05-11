import { createAvatar } from '@dicebear/core'
import { funEmoji } from '@dicebear/collection'
import { authedTemplate, headerTemplate } from './templates'
import { loadProfileForHeader, setupHeaderMenu } from './header'
import { setupOnboarding } from './onboarding'

export const renderAuthed = ({ app, supabase, session }) => {
  const user = session?.user
  const placeholderAvatar = createAvatar(funEmoji, {
    seed: user?.id || user?.email || 'emojiboxd',
    size: 64,
  }).toDataUri()

  app.innerHTML = authedTemplate(
    headerTemplate({
      username: user?.email?.split('@')[0] || 'Account',
      avatarUrl: placeholderAvatar,
    })
  )

  const headerCleanup = setupHeaderMenu({ app, supabase })
  let onboardingCleanup = () => {}

  setupOnboarding({ app, supabase, user }).then((cleanup) => {
    onboardingCleanup = cleanup || (() => {})
  })

  loadProfileForHeader({ app, supabase, user }).catch((error) => {
    console.error('Unable to load profile for header', error)
  })

  return () => {
    headerCleanup?.()
    onboardingCleanup?.()
  }
}
