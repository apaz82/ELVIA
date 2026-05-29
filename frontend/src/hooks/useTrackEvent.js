import { useCallback } from 'react'
import { supabase } from '../services/authService'
import { useAuth } from '../context/AuthContext'

export function useTrackEvent() {
  const { user } = useAuth()

  const track = useCallback((event, feature = null, metadata = {}) => {
    if (!user?.id) return
    // fire-and-forget: nunca bloquea el UI
    supabase.from('user_events').insert({
      user_id:  user.id,
      event,
      feature,
      page:     window.location.pathname,
      metadata,
    }).then(({ error }) => {
      if (error) console.warn('[track]', error.message)
    })
  }, [user?.id])

  return track
}
