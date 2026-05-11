import { createAvatar } from '@dicebear/core'
import { funEmoji } from '@dicebear/collection'

export const loadProfileForHeader = async ({ app, supabase, user }) => {
  if (!user || !app.querySelector('[data-page="authed"]')) {
    return
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  const displayName =
    profile?.username ||
    user.user_metadata?.username ||
    user.user_metadata?.preferred_username ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'Account'

  const avatarUrl =
    profile?.avatar_url ||
    createAvatar(funEmoji, {
      seed: displayName,
      size: 64,
    }).toDataUri()

  const nameEl = app.querySelector('[data-user-name]')
  const avatarEl = app.querySelector('[data-user-avatar]')

  if (nameEl) {
    nameEl.textContent = displayName
  }
  if (avatarEl) {
    avatarEl.src = avatarUrl
  }
}

export const setupHeaderMenu = ({ app, supabase }) => {
  const menuButton = app.querySelector('[data-menu-toggle]')
  const menu = app.querySelector('[data-menu]')
  const logoutButton = app.querySelector('[data-action="logout"]')
  const settingsButton = app.querySelector('[data-action="settings"]')

  if (!menuButton || !menu) {
    return () => {}
  }

  const openMenu = () => {
    menu.classList.remove('hidden')
    menuButton.setAttribute('aria-expanded', 'true')
  }

  const closeMenu = () => {
    menu.classList.add('hidden')
    menuButton.setAttribute('aria-expanded', 'false')
  }

  const toggleMenu = () => {
    if (menu.classList.contains('hidden')) {
      openMenu()
    } else {
      closeMenu()
    }
  }

  const handleDocumentClick = (event) => {
    if (!menu.contains(event.target) && !menuButton.contains(event.target)) {
      closeMenu()
    }
  }

  const handleKeydown = (event) => {
    if (event.key === 'Escape') {
      closeMenu()
    }
  }

  const handleLogout = async () => {
    closeMenu()
    await supabase.auth.signOut()
  }

  const handleSettings = () => {
    closeMenu()
  }

  menuButton.addEventListener('click', toggleMenu)
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleKeydown)
  logoutButton?.addEventListener('click', handleLogout)
  settingsButton?.addEventListener('click', handleSettings)

  return () => {
    menuButton.removeEventListener('click', toggleMenu)
    document.removeEventListener('click', handleDocumentClick)
    document.removeEventListener('keydown', handleKeydown)
    logoutButton?.removeEventListener('click', handleLogout)
    settingsButton?.removeEventListener('click', handleSettings)
  }
}
