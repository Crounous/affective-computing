import { guestTemplate } from './templates'
import { resetOnboardingDraft } from './onboarding'

export const renderGuest = ({ app, supabase }) => {
  resetOnboardingDraft()
  app.innerHTML = guestTemplate

  const modal = app.querySelector('#auth-modal')
  const title = app.querySelector('#auth-title')
  const subtitle = app.querySelector('#auth-subtitle')
  const form = app.querySelector('#auth-form')
  const emailInput = app.querySelector('#auth-email')
  const passwordInput = app.querySelector('#auth-password')
  const confirmField = app.querySelector('#confirm-field')
  const confirmInput = app.querySelector('#auth-confirm')
  const submitButton = app.querySelector('#auth-submit')
  const switchButton = app.querySelector('#auth-switch')
  const gmailButton = app.querySelector('#auth-gmail')
  const message = app.querySelector('#auth-message')

  const setMessage = (text, tone = 'text-slate-400') => {
    message.textContent = text
    message.classList.remove('text-slate-400', 'text-emerald-300', 'text-rose-300')
    message.classList.add(tone)
  }

  const setLoading = (isLoading, label = 'Working...') => {
    submitButton.disabled = isLoading
    switchButton.disabled = isLoading
    gmailButton.disabled = isLoading
    submitButton.textContent = isLoading
      ? label
      : submitButton.dataset.label || submitButton.textContent
    gmailButton.textContent = isLoading
      ? 'Connecting...'
      : gmailButton.dataset.label || gmailButton.textContent
  }

  const deriveUsername = (email) =>
    email
      .split('@')[0]
      .replace(/[^a-zA-Z0-9_]/g, '')
      .slice(0, 24)

  const setMode = (mode) => {
    const isLogin = mode === 'login'
    title.textContent = isLogin ? 'Log in' : 'Create account'
    subtitle.textContent = isLogin
      ? 'Welcome back. Enter your details.'
      : 'Join emojiboxd and start reviewing.'
    submitButton.textContent = isLogin ? 'Log in' : 'Sign up'
    submitButton.dataset.label = submitButton.textContent
    switchButton.textContent = isLogin
      ? 'Need an account? Sign up'
      : 'Already have an account? Log in'
    switchButton.dataset.label = switchButton.textContent
    gmailButton.dataset.label = 'Continue with Gmail'
    confirmField.classList.toggle('hidden', isLogin)
    form.dataset.mode = mode
    setMessage('')
    setLoading(false)
  }

  const openModal = (mode) => {
    setMode(mode)
    form.reset()
    modal.classList.remove('hidden')
    emailInput.focus()
  }

  const closeModal = () => {
    modal.classList.add('hidden')
    setMessage('')
  }

  app.querySelectorAll('[data-open]').forEach((trigger) => {
    trigger.addEventListener('click', () => openModal(trigger.dataset.open))
  })

  modal.querySelectorAll('[data-close]').forEach((trigger) => {
    trigger.addEventListener('click', closeModal)
  })

  switchButton.addEventListener('click', () => {
    const nextMode = form.dataset.mode === 'login' ? 'signup' : 'login'
    setMode(nextMode)
  })

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const mode = form.dataset.mode
    const email = emailInput.value.trim()
    const password = passwordInput.value

    if (!email || !email.includes('@')) {
      setMessage('Enter a valid email address.', 'text-rose-300')
      emailInput.focus()
      return
    }

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.', 'text-rose-300')
      passwordInput.focus()
      return
    }

    if (mode === 'signup' && confirmInput.value !== password) {
      setMessage('Passwords do not match.', 'text-rose-300')
      confirmInput.focus()
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setMessage(error.message, 'text-rose-300')
          return
        }
        setMessage('Signed in successfully. Redirecting...', 'text-emerald-300')
      } else {
        const username = deriveUsername(email)
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
            },
          },
        })

        if (error) {
          setMessage(error.message, 'text-rose-300')
          return
        }

        if (!data.session) {
          setMessage('Check your email to confirm your account.', 'text-emerald-300')
        } else {
          setMessage('Account created. Welcome to emojiboxd!', 'text-emerald-300')
        }
      }
    } finally {
      setLoading(false)
    }
  })

  gmailButton.addEventListener('click', async () => {
    setLoading(true, 'Opening Gmail...')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      })

      if (error) {
        setMessage(error.message, 'text-rose-300')
      }
    } finally {
      setLoading(false)
    }
  })

  const handleKeydown = (event) => {
    if (event.key === 'Escape') {
      closeModal()
    }
  }

  document.addEventListener('keydown', handleKeydown)
  setMode('login')

  return () => {
    document.removeEventListener('keydown', handleKeydown)
  }
}
