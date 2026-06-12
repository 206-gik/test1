import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/planUtils'
import PricingClient from './PricingClient'

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const planData = await getUserPlan(user.id)

  return <PricingClient userId={user.id} currentPlan={planData.plan} />
}
