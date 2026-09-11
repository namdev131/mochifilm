ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'episode',
  ADD COLUMN IF NOT EXISTS broadcast_id UUID;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notification_kind_check;
ALTER TABLE public.notifications ADD CONSTRAINT notification_kind_check
  CHECK (kind IN ('episode', 'admin'));

CREATE UNIQUE INDEX IF NOT EXISTS notifications_broadcast_recipient_unique
  ON public.notifications(user_id, broadcast_id) WHERE broadcast_id IS NOT NULL;

REVOKE INSERT, DELETE ON public.notifications FROM authenticated;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;

DROP POLICY IF EXISTS "Users manage their own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
