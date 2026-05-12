import './style.css'
import { supabase } from './lib/supabaseClient'
import { renderAuthed } from './ui/authed'
import { renderGuest } from './ui/guest'

const app = document.querySelector('#app')
let currentUserId = null
let cleanupView = null

const showGuest = () => {
  cleanupView?.()
  cleanupView = renderGuest({ app, supabase })
  currentUserId = null
}

const showAuthed = (session) => {
  cleanupView?.()
  cleanupView = renderAuthed({ app, supabase, session })
  currentUserId = session?.user?.id ?? null
}

const syncSessionView = async () => {
  const { data } = await supabase.auth.getSession()
  if (data.session) {
    showAuthed(data.session)
  } else {
    showGuest()
  }
}

syncSessionView()

let signoutTimer = null

supabase.auth.onAuthStateChange((event, session) => {
  // Ignore INITIAL_SESSION as syncSessionView handles the initial load
  if (event === 'INITIAL_SESSION') {
    return
  }

  if (signoutTimer) {
    clearTimeout(signoutTimer)
    signoutTimer = null
  }

  const isAuthedView = Boolean(app.querySelector('[data-page="authed"]'))

  if (session) {
    if (isAuthedView) {
      return
    }
    showAuthed(session)
    return
  }

  if (event === 'SIGNED_OUT') {
    // Delay sign-out to ignore transient tab-focus events
    signoutTimer = setTimeout(() => {
      showGuest()
    }, 100)
  }
})
