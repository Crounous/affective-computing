import './style.css'

document.querySelector('#app').innerHTML = `
  <main class="min-h-screen">
    <div class="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div class="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[140px]"></div>
      <div class="pointer-events-none absolute -bottom-40 right-0 h-[520px] w-[520px] translate-x-1/3 rounded-full bg-amber-400/20 blur-[160px]"></div>

      <div class="relative z-10 flex flex-col items-center text-center animate-fade-up">
        <h1 class="font-display text-5xl font-semibold text-white sm:text-7xl">emojiboxd</h1>
        <button
          class="mt-6 rounded-full bg-amber-300 px-6 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-200"
          type="button"
          data-open="login"
        >
          Log in
        </button>
        <button
          class="mt-3 text-sm text-slate-300 transition hover:text-white"
          type="button"
          data-open="signup"
        >
          Register
        </button>
      </div>
    </div>
  </main>

  <div
    id="auth-modal"
    class="fixed inset-0 z-50 hidden flex items-center justify-center px-6"
    role="dialog"
    aria-modal="true"
    aria-labelledby="auth-title"
  >
    <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" data-close></div>
    <div class="relative w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl shadow-black/50">
      <button
        class="absolute right-4 top-4 rounded-full border border-white/10 px-2 py-1 text-xs text-slate-300 transition hover:border-white/30"
        type="button"
        aria-label="Close"
        data-close
      >
        Close
      </button>
      <p class="text-xs uppercase tracking-[0.3em] text-slate-400">Member access</p>
      <h2 id="auth-title" class="mt-3 font-display text-2xl text-white">Log in</h2>
      <p id="auth-subtitle" class="mt-2 text-sm text-slate-400">
        Welcome back. Enter your details.
      </p>
      <form id="auth-form" class="mt-6 space-y-4">
        <label class="block space-y-2 text-xs uppercase tracking-[0.3em] text-slate-400">
          Email
          <input
            id="auth-email"
            class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-300/80 focus:outline-none"
            type="email"
            name="email"
            placeholder="you@example.com"
            autocomplete="email"
            required
          />
        </label>
        <label class="block space-y-2 text-xs uppercase tracking-[0.3em] text-slate-400">
          Password
          <input
            id="auth-password"
            class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-300/80 focus:outline-none"
            type="password"
            name="password"
            placeholder="Minimum 8 characters"
            autocomplete="current-password"
            required
          />
        </label>
        <label id="confirm-field" class="hidden block space-y-2 text-xs uppercase tracking-[0.3em] text-slate-400">
          Confirm password
          <input
            id="auth-confirm"
            class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-300/80 focus:outline-none"
            type="password"
            name="confirm"
            placeholder="Repeat password"
            autocomplete="new-password"
          />
        </label>
        <button
          id="auth-submit"
          class="w-full rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
          type="submit"
        >
          Log in
        </button>
        <button
          id="auth-switch"
          class="w-full rounded-full border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/40"
          type="button"
        >
          Need an account? Sign up
        </button>
      </form>
      <div class="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-500">
        <span class="h-px flex-1 bg-white/10"></span>
        or
        <span class="h-px flex-1 bg-white/10"></span>
      </div>
      <button
        id="auth-gmail"
        class="w-full rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white/90 transition hover:border-white/30"
        type="button"
      >
        Continue with Gmail
      </button>
      <p id="auth-message" class="mt-4 min-h-[1.25rem] text-xs text-slate-400"></p>
    </div>
  </div>
`

const modal = document.querySelector('#auth-modal')
const title = document.querySelector('#auth-title')
const subtitle = document.querySelector('#auth-subtitle')
const form = document.querySelector('#auth-form')
const emailInput = document.querySelector('#auth-email')
const passwordInput = document.querySelector('#auth-password')
const confirmField = document.querySelector('#confirm-field')
const confirmInput = document.querySelector('#auth-confirm')
const submitButton = document.querySelector('#auth-submit')
const switchButton = document.querySelector('#auth-switch')
const gmailButton = document.querySelector('#auth-gmail')
const message = document.querySelector('#auth-message')

const setMessage = (text, tone = 'text-slate-400') => {
  message.textContent = text
  message.classList.remove('text-slate-400', 'text-emerald-300', 'text-rose-300')
  message.classList.add(tone)
}

const setMode = (mode) => {
  const isLogin = mode === 'login'
  title.textContent = isLogin ? 'Log in' : 'Create account'
  subtitle.textContent = isLogin
    ? 'Welcome back. Enter your details.'
    : 'Join emojiboxd and start reviewing.'
  submitButton.textContent = isLogin ? 'Log in' : 'Sign up'
  switchButton.textContent = isLogin
    ? 'Need an account? Sign up'
    : 'Already have an account? Log in'
  confirmField.classList.toggle('hidden', isLogin)
  form.dataset.mode = mode
  setMessage('')
}

const openModal = (mode) => {
  setMode(mode)
  form.reset()
  modal.classList.remove('hidden')
  emailInput.focus()
}

const closeModal = () => {
  modal.classList.add('hidden')
}

document.querySelectorAll('[data-open]').forEach((trigger) => {
  trigger.addEventListener('click', () => openModal(trigger.dataset.open))
})

document.querySelectorAll('[data-close]').forEach((trigger) => {
  trigger.addEventListener('click', closeModal)
})

switchButton.addEventListener('click', () => {
  const nextMode = form.dataset.mode === 'login' ? 'signup' : 'login'
  setMode(nextMode)
})

form.addEventListener('submit', (event) => {
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

  setMessage(
    mode === 'login'
      ? 'Signed in successfully. Redirecting...'
      : 'Account created. Welcome to emojiboxd!',
    'text-emerald-300'
  )
})

gmailButton.addEventListener('click', () => {
  setMessage('Gmail sign-in ready. Completing demo login...', 'text-emerald-300')
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal()
  }
})
