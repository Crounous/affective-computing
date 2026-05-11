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

supabase.auth.onAuthStateChange((_event, session) => {
  const isAuthedView = Boolean(app.querySelector('[data-page="authed"]'))

  if (session) {
    if (currentUserId === session.user.id && isAuthedView) {
      return
    }
    showAuthed(session)
    return
  }

  if (!session && currentUserId === null && !isAuthedView) {
    return
  }

  showGuest()
})
