export const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export const headerTemplate = ({ username, avatarUrl }) => `
  <header class="relative z-20 border-b border-white/10 bg-slate-950/60 backdrop-blur">
    <div class="mx-auto flex items-center justify-between px-6 py-4">
      <a class="font-display text-lg text-white" href="/" data-nav="home">
        emojiboxd
      </a>
      <div class="relative">
        <button
          class="flex items-center gap-3 bg-transparent px-2 py-2 text-sm text-slate-200 transition hover:text-white"
          type="button"
          data-menu-toggle
          aria-expanded="false"
          aria-controls="user-menu"
        >
          <img
            data-user-avatar
            class="h-8 w-8 rounded-full border border-white/10"
            src="${escapeHtml(avatarUrl)}"
            alt="Profile avatar"
          />
          <span data-user-name class="hidden text-sm font-semibold sm:inline">${escapeHtml(username)}</span>
          <span class="text-xs text-slate-400">▼</span>
        </button>
        <div
          id="user-menu"
          data-menu
          class="absolute right-0 mt-3 hidden min-w-[180px] rounded-2xl border border-white/10 bg-slate-900/95 p-2 text-sm text-slate-200 shadow-xl shadow-black/50"
        >
          <button
            class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-slate-200 transition hover:bg-white/5"
            type="button"
            data-action="settings"
          >
            Settings
          </button>
          <button
            class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-rose-300 transition hover:bg-white/5"
            type="button"
            data-action="logout"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  </header>
`

export const guestTemplate = `
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
          class="w-full rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
        >
          Log in
        </button>
        <button
          id="auth-switch"
          class="w-full rounded-full border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
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
        class="w-full rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white/90 transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
      >
        Continue with Gmail
      </button>
      <p id="auth-message" class="mt-4 min-h-[1.25rem] text-xs text-slate-400"></p>
    </div>
  </div>
`

export const authedTemplate = (headerHtml) => `
  <div class="min-h-screen" data-page="authed">
    ${headerHtml}
    <main class="mx-auto w-full max-w-7xl px-6 py-10 overflow-x-hidden">
      <div class="grid min-w-0 gap-8 lg:grid-cols-[220px_1fr]">
        <aside class="space-y-6 rounded-3xl border border-white/10 bg-slate-900/50 p-5 text-sm text-slate-200">
          <div>
            <p class="text-xs uppercase tracking-[0.3em] text-slate-400">Library</p>
            <nav class="mt-4 space-y-2">
              <button class="flex w-full items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-left">
                Home
                <span class="text-xs text-slate-400">Now</span>
              </button>
              <button class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-white/5">
                History
              </button>
              <button class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-white/5">
                Reviews
              </button>
              <button class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-white/5">
                Watchlist
              </button>
              <button class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-white/5">
                Friends
              </button>
            </nav>
          </div>
        </aside>

        <section class="min-w-0 space-y-10" data-video-query="video essay">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs uppercase tracking-[0.3em] text-slate-400">Suggested</p>
              <h2 class="mt-2 font-display text-2xl text-white">Tonight on YouTube</h2>
            </div>
            <button class="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-white/30">
              See all
            </button>
          </div>
          <p class="text-xs text-slate-400" data-video-status aria-live="polite">Loading suggestions...</p>
          <div class="relative">
            <button
              class="absolute left-0 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-900/80 text-white/80 transition hover:border-white/30 hover:text-white sm:flex"
              type="button"
              data-carousel-prev
              aria-label="Scroll left"
            >
              ←
            </button>
            <button
              class="absolute right-0 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-900/80 text-white/80 transition hover:border-white/30 hover:text-white sm:flex"
              type="button"
              data-carousel-next
              aria-label="Scroll right"
            >
              →
            </button>
            <div class="flex max-w-full gap-4 overflow-x-auto pb-4 scroll-smooth no-scrollbar" data-video-carousel>
              <article class="relative min-w-[260px] overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 animate-pulse">
                <div class="aspect-video w-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950"></div>
                <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent"></div>
                <div class="absolute inset-x-0 bottom-0 space-y-2 px-4 pb-4">
                  <div class="h-3 w-4/5 rounded-full bg-slate-700/80"></div>
                  <div class="h-3 w-1/2 rounded-full bg-slate-700/60"></div>
                </div>
              </article>
              <article class="relative min-w-[260px] overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 animate-pulse">
                <div class="aspect-video w-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950"></div>
                <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent"></div>
                <div class="absolute inset-x-0 bottom-0 space-y-2 px-4 pb-4">
                  <div class="h-3 w-4/5 rounded-full bg-slate-700/80"></div>
                  <div class="h-3 w-1/2 rounded-full bg-slate-700/60"></div>
                </div>
              </article>
              <article class="relative min-w-[260px] overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 animate-pulse">
                <div class="aspect-video w-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950"></div>
                <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent"></div>
                <div class="absolute inset-x-0 bottom-0 space-y-2 px-4 pb-4">
                  <div class="h-3 w-4/5 rounded-full bg-slate-700/80"></div>
                  <div class="h-3 w-1/2 rounded-full bg-slate-700/60"></div>
                </div>
              </article>
            </div>
          </div>

          <div class="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div class="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-white">Recent reviews</h3>
                <button class="text-xs uppercase tracking-[0.3em] text-slate-400">View all</button>
              </div>
              <div class="mt-4 space-y-3 text-sm text-slate-200">
                <div class="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <p class="font-semibold text-white">Why the pacing finally works</p>
                    <p class="text-xs text-slate-400">2 days ago</p>
                  </div>
                  <span class="text-xs text-amber-200">8.6</span>
                </div>
                <div class="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <p class="font-semibold text-white">Thumbnail glow-up breakdown</p>
                    <p class="text-xs text-slate-400">5 days ago</p>
                  </div>
                  <span class="text-xs text-amber-200">7.9</span>
                </div>
                <div class="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <p class="font-semibold text-white">Story arc, zero fluff</p>
                    <p class="text-xs text-slate-400">1 week ago</p>
                  </div>
                  <span class="text-xs text-amber-200">9.1</span>
                </div>
              </div>
            </div>

            <div class="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
              <h3 class="text-lg font-semibold text-white">Friends activity</h3>
              <div class="mt-4 space-y-4 text-sm text-slate-200">
                <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p class="font-semibold text-white">Alex reviewed Neon Cut Lab</p>
                  <p class="text-xs text-slate-400">"Sound design hits hard."</p>
                </div>
                <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p class="font-semibold text-white">Mina saved a new watchlist</p>
                  <p class="text-xs text-slate-400">"Deep dives I need to binge"</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>

  <div
    id="video-player-modal"
    class="fixed inset-0 z-50 hidden flex items-center justify-center px-6"
    role="dialog"
    aria-modal="true"
    aria-labelledby="video-player-title"
  >
    <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" data-player-close></div>
    <div class="relative w-full max-w-4xl">
      <div class="overflow-hidden rounded-3xl border border-white/40 shadow-2xl shadow-black/60">
        <div class="aspect-video w-full" id="video-player-frame"></div>
      </div>
      <div class="flex justify-center pb-4 pt-4">
        <div class="flex items-center gap-3 rounded-full border border-white/20 bg-slate-950/70 px-4 py-3 shadow-xl shadow-black/50 backdrop-blur">
          <span class="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg" data-emotion-dot>•</span>
          <span class="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg" data-emotion-dot>•</span>
          <span class="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg" data-emotion-dot>•</span>
          <span class="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg" data-emotion-dot>•</span>
          <span class="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg" data-emotion-dot>•</span>
        </div>
      </div>
      <video id="emotion-video" class="hidden" autoplay muted playsinline></video>
    </div>
  </div>

  <div
    id="onboarding-modal"
    class="fixed inset-0 z-50 hidden flex items-center justify-center px-6"
    role="dialog"
    aria-modal="true"
    aria-labelledby="onboarding-title"
  >
    <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"></div>
    <div class="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl shadow-black/60">
      <p class="text-xs uppercase tracking-[0.3em] text-slate-400">First time here</p>
      <h2 id="onboarding-title" class="mt-3 font-display text-2xl text-white">
        Finish your profile
      </h2>
      <p class="mt-2 text-sm text-slate-400">
        Set a username, password, and profile picture to continue.
      </p>
      <form id="onboarding-form" class="mt-6 space-y-4">
        <label class="block space-y-2 text-xs uppercase tracking-[0.3em] text-slate-400">
          Username
          <input
            id="onboard-username"
            class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-300/80 focus:outline-none"
            type="text"
            name="username"
            placeholder="emojifan"
            autocomplete="username"
            required
          />
        </label>
        <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p class="text-xs uppercase tracking-[0.3em] text-slate-400">Profile picture</p>
          <div class="mt-4 flex items-center gap-4">
            <img
              id="onboard-preview"
              class="h-16 w-16 rounded-2xl border border-white/10 bg-slate-800/80"
              alt="Avatar preview"
            />
            <div class="flex-1 space-y-3">
              <input
                id="onboard-avatar"
                class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-amber-300/80 focus:outline-none"
                type="url"
                name="avatar"
                placeholder="Paste an image URL (optional)"
              />
              <button
                id="onboard-generate"
                class="w-full rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 transition hover:border-white/30"
                type="button"
              >
                Generate emoji avatar
              </button>
            </div>
          </div>
        </div>
        <label class="block space-y-2 text-xs uppercase tracking-[0.3em] text-slate-400">
          Password
          <input
            id="onboard-password"
            class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-300/80 focus:outline-none"
            type="password"
            name="password"
            placeholder="Minimum 8 characters"
            autocomplete="new-password"
            required
          />
        </label>
        <label class="block space-y-2 text-xs uppercase tracking-[0.3em] text-slate-400">
          Confirm password
          <input
            id="onboard-confirm"
            class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-300/80 focus:outline-none"
            type="password"
            name="confirm"
            placeholder="Repeat password"
            autocomplete="new-password"
            required
          />
        </label>
        <button
          id="onboard-submit"
          class="w-full rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
        >
          Save profile
        </button>
      </form>
      <div class="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span id="onboard-message" class="min-h-[1.25rem] text-slate-400"></span>
        <button
          id="onboard-signout"
          class="text-xs uppercase tracking-[0.3em] text-slate-400 transition hover:text-white"
          type="button"
        >
          Sign out
        </button>
      </div>
    </div>
  </div>
`
