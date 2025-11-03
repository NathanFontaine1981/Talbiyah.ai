/*
  # Optimize RLS Policies - Part 2: Referrals and Credit Redemptions

  1. Performance Optimization
    - Replace auth.uid() with (SELECT auth.uid()) to prevent re-evaluation per row
  
  2. Tables Updated
    - referrals
    - credit_redemptions
*/

-- Referrals policies
DROP POLICY IF EXISTS "Admin users can manage all referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can read own referral records" ON public.referrals;
DROP POLICY IF EXISTS "System can insert referral records" ON public.referrals;
DROP POLICY IF EXISTS "System can update referral records" ON public.referrals;

CREATE POLICY "Admin users can manage all referrals"
  ON public.referrals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

CREATE POLICY "Users can read own referral records"
  ON public.referrals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.learners
      WHERE learners.id = referrals.referrer_id
      AND learners.parent_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "System can insert referral records"
  ON public.referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update referral records"
  ON public.referrals
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Credit Redemptions policies
DROP POLICY IF EXISTS "System can insert redemption records" ON public.credit_redemptions;
DROP POLICY IF EXISTS "Users can read own redemption history" ON public.credit_redemptions;

CREATE POLICY "System can insert redemption records"
  ON public.credit_redemptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.learners
      WHERE learners.id = credit_redemptions.learner_id
      AND learners.parent_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can read own redemption history"
  ON public.credit_redemptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.learners
      WHERE learners.id = credit_redemptions.learner_id
      AND learners.parent_id = (SELECT auth.uid())
    )
  );
