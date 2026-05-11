import { createAvatar } from '@dicebear/core'
import { funEmoji } from '@dicebear/collection'

let onboardingDraft = null
let draftUserId = null

export const resetOnboardingDraft = () => {
  onboardingDraft = null
  draftUserId = null
}

export const setupOnboarding = async ({ app, supabase, user }) => {
  const noop = () => {}

  if (!user) {
    resetOnboardingDraft()
    return noop
  }

  if (draftUserId && draftUserId !== user.id) {
    resetOnboardingDraft()
  }
  draftUserId = user.id

  const modal = app.querySelector('#onboarding-modal')
  const form = app.querySelector('#onboarding-form')
  const usernameInput = app.querySelector('#onboard-username')
  const avatarInput = app.querySelector('#onboard-avatar')
  const previewImage = app.querySelector('#onboard-preview')
  const generateButton = app.querySelector('#onboard-generate')
  const passwordInput = app.querySelector('#onboard-password')
  const confirmInput = app.querySelector('#onboard-confirm')
  const submitButton = app.querySelector('#onboard-submit')
  const message = app.querySelector('#onboard-message')
  const signoutButton = app.querySelector('#onboard-signout')

  if (!modal || !form) {
    return noop
  }

  const providers = user.app_metadata?.providers || []
  const isGoogleUser =
    user.app_metadata?.provider === 'google' ||
    providers.includes('google') ||
    user.identities?.some((identity) => identity.provider === 'google')

  if (!isGoogleUser) {
    return noop
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, onboarded_at')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Unable to load profile', error)
    return noop
  }

  if (!app.contains(modal)) {
    return noop
  }

  if (profile?.onboarded_at) {
    resetOnboardingDraft()
    return noop
  }

  const seedFromUser =
    profile?.username ||
    user.user_metadata?.preferred_username ||
    user.user_metadata?.full_name ||
    user.email ||
    'emojiboxd'

  const normalizeUsername = (value) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 24)

  const randomSeed = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)

  const generateAvatar = (seed) =>
    createAvatar(funEmoji, {
      seed,
      size: 128,
    }).toDataUri()

  const fallbackAvatar = generateAvatar(seedFromUser)

  if (!onboardingDraft) {
    onboardingDraft = {
      usernameRaw: normalizeUsername(seedFromUser),
      avatarUrl: profile?.avatar_url || '',
      generatedAvatar: fallbackAvatar,
      password: '',
      confirm: '',
    }
  }

  let generatedAvatar = onboardingDraft.generatedAvatar || fallbackAvatar

  const setMessage = (text, tone = 'text-slate-400') => {
    message.textContent = text
    message.classList.remove('text-slate-400', 'text-emerald-300', 'text-rose-300')
    message.classList.add(tone)
  }

  const setLoading = (isLoading) => {
    submitButton.disabled = isLoading
    generateButton.disabled = isLoading
    signoutButton.disabled = isLoading
  }

  const updatePreview = (value) => {
    previewImage.src = value
  }

  usernameInput.value = onboardingDraft.usernameRaw
  avatarInput.value = onboardingDraft.avatarUrl
  passwordInput.value = onboardingDraft.password
  confirmInput.value = onboardingDraft.confirm
  updatePreview(onboardingDraft.avatarUrl || generatedAvatar)

  modal.classList.remove('hidden')

  const handleGenerate = () => {
    const seed = `${usernameInput.value || user.email || 'emojiboxd'}-${randomSeed()}`
    generatedAvatar = generateAvatar(seed)
    onboardingDraft.generatedAvatar = generatedAvatar
    onboardingDraft.avatarUrl = ''
    avatarInput.value = ''
    updatePreview(generatedAvatar)
    if (!avatarInput.value) {
      setMessage('Generated a new avatar preview.', 'text-emerald-300')
    }
  }

  const handleAvatarInput = () => {
    if (avatarInput.value.trim()) {
      onboardingDraft.avatarUrl = avatarInput.value.trim()
      updatePreview(avatarInput.value.trim())
      return
    }
    onboardingDraft.avatarUrl = ''
    updatePreview(generatedAvatar)
  }

  const handleUsernameInput = () => {
    onboardingDraft.usernameRaw = usernameInput.value
  }

  const handlePasswordInput = () => {
    onboardingDraft.password = passwordInput.value
  }

  const handleConfirmInput = () => {
    onboardingDraft.confirm = confirmInput.value
  }

  const handleSignout = async () => {
    resetOnboardingDraft()
    await supabase.auth.signOut()
  }

  generateButton.addEventListener('click', handleGenerate)
  avatarInput.addEventListener('input', handleAvatarInput)
  usernameInput.addEventListener('input', handleUsernameInput)
  passwordInput.addEventListener('input', handlePasswordInput)
  confirmInput.addEventListener('input', handleConfirmInput)
  signoutButton.addEventListener('click', handleSignout)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const rawUsername = onboardingDraft.usernameRaw || usernameInput.value
    const username = normalizeUsername(rawUsername)
    const avatarUrl = avatarInput.value.trim() || generatedAvatar
    const password = passwordInput.value
    const confirm = confirmInput.value

    if (username.length < 3) {
      setMessage('Username must be at least 3 characters.', 'text-rose-300')
      usernameInput.focus()
      return
    }

    if (rawUsername !== username) {
      usernameInput.value = username
      onboardingDraft.usernameRaw = username
    }

    if (!avatarUrl) {
      setMessage('Add a profile picture or generate one.', 'text-rose-300')
      return
    }

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.', 'text-rose-300')
      passwordInput.focus()
      return
    }

    if (password !== confirm) {
      setMessage('Passwords do not match.', 'text-rose-300')
      confirmInput.focus()
      return
    }

    setLoading(true)
    try {
      const { data: existing, error: lookupError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle()

      if (lookupError) {
        setMessage('Could not validate username. Try again.', 'text-rose-300')
        return
      }

      if (existing && existing.id !== user.id) {
        setMessage('That username is already taken.', 'text-rose-300')
        return
      }

      const { error: passwordError } = await supabase.auth.updateUser({ password })
      if (passwordError) {
        setMessage(passwordError.message, 'text-rose-300')
        return
      }

      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: user.id,
          username,
          avatar_url: avatarUrl,
          onboarded_at: new Date().toISOString(),
        },
        {
          onConflict: 'id',
        }
      )

      if (profileError) {
        setMessage(profileError.message, 'text-rose-300')
        return
      }

      setMessage('Profile saved. Welcome to emojiboxd!', 'text-emerald-300')
      resetOnboardingDraft()
      modal.classList.add('hidden')
    } finally {
      setLoading(false)
    }
  }

  form.addEventListener('submit', handleSubmit)

  const cleanup = () => {
    form.removeEventListener('submit', handleSubmit)
    generateButton.removeEventListener('click', handleGenerate)
    avatarInput.removeEventListener('input', handleAvatarInput)
    usernameInput.removeEventListener('input', handleUsernameInput)
    passwordInput.removeEventListener('input', handlePasswordInput)
    confirmInput.removeEventListener('input', handleConfirmInput)
    signoutButton.removeEventListener('click', handleSignout)
  }

  return cleanup
}
