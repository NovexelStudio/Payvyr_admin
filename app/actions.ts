'use server'
import { createClient } from '@supabase/supabase-js'
import { adminAuth, db } from '@/lib/firebase-admin'
import { revalidatePath } from 'next/cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function addRedeemCode(formData: FormData) {
  const code = formData.get('code') as string
  const amount = formData.get('amount') as string

  const { error } = await supabase.from('redeem_codes').insert([
    { code: code, amount: amount }
  ])
  
  if (error) console.error(error)
  revalidatePath('/')
}

export async function banUser(formData: FormData) {
  const uid = formData.get('uid') as string
  try {
    await adminAuth.updateUser(uid, { disabled: true });
    revalidatePath('/')
  } catch (error) {
    console.error('Failed to ban user:', error)
  }
}

export async function unbanUser(formData: FormData) {
  const uid = formData.get('uid') as string
  try {
    await adminAuth.updateUser(uid, { disabled: false });
    revalidatePath('/')
  } catch (error) {
    console.error('Failed to unban user:', error)
  }
}

export async function getRedeemCodes() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { data, error } = await supabase
    .from('redeem_codes')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching codes:', error)
    return []
  }
  
  return data || []
}

export async function getUserInfo(uid: string) {
  try {
    const user = await adminAuth.getUser(uid);
    return { 
      user: {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber,
        disabled: user.disabled,
        metadata: {
          creationTime: user.metadata.creationTime,
          lastSignInTime: user.metadata.lastSignInTime
        }
      }
    }
  } catch (error) {
    console.error('Error fetching user:', error)
    return { error: "User not found" }
  }
}

export async function getAllUsers() {
  try {
    const users = await adminAuth.listUsers();
    return { 
      users: users.users.map(user => ({
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber,
        disabled: user.disabled,
        metadata: {
          creationTime: user.metadata.creationTime,
          lastSignInTime: user.metadata.lastSignInTime
        }
      }))
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    return { error: "Failed to fetch users" }
  }
}

export async function removeUsedCodesByValue(amount: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { data, error } = await supabase
      .from('redeem_codes')
      .delete()
      .eq('amount', amount)
      .eq('used', true)

    if (error) {
      console.error('Error removing codes:', error)
      return { error: "Failed to remove codes" }
    }

    return { success: true, removed: data }
  } catch (error) {
    console.error('Error in removeUsedCodesByValue:', error)
    return { error: "Failed to remove codes" }
  }
}

export async function deleteRedeemCode(codeId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { error } = await supabase
      .from('redeem_codes')
      .delete()
      .eq('id', codeId)

    if (error) {
      console.error('Error deleting code:', error)
      return { error: "Failed to delete code" }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in deleteRedeemCode:', error)
    return { error: "Failed to delete code" }
  }
}

export async function redeemCode(code: string, userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // First check if code exists and is not used
    const { data: existingCode, error: fetchError } = await supabase
      .from('redeem_codes')
      .select('*')
      .eq('code', code)
      .eq('used', false)
      .single()

    if (fetchError || !existingCode) {
      return { error: "Invalid or already used code" }
    }

    // Update the code as used
    const { error: updateError } = await supabase
      .from('redeem_codes')
      .update({
        used: true,
        used_by: userId,
        used_at: new Date().toISOString()
      })
      .eq('code', code)

    if (updateError) {
      console.error('Error updating code:', updateError)
      return { error: "Failed to redeem code" }
    }

    return { success: true, amount: existingCode.amount }
  } catch (error) {
    console.error('Error in redeemCode:', error)
    return { error: "Failed to redeem code" }
  }
}

export async function getUserRealtimeData(uid: string) {
  try {
    const snapshot = await db.ref(`users/${uid}`).once('value')
    const data = snapshot.val()
    return { userData: data }
  } catch (error) {
    console.error('Error fetching user realtime data:', error)
    return { error: "Failed to fetch user data" }
  }
}
export async function getRedemptions() {
  try {
    const snapshot = await db.ref('redemptions').once('value')
    const data = snapshot.val()
    return { redemptions: data || {} }
  } catch (error) {
    console.error('Error fetching redemptions:', error)
    return { error: "Failed to fetch redemptions" }
  }
}
export async function getAllUsersRealtimeData() {
  try {
    const snapshot = await db.ref('users').once('value')
    const data = snapshot.val()
    return { usersData: data }
  } catch (error) {
    console.error('Error fetching all users realtime data:', error)
    return { error: "Failed to fetch users data" }
  }
}

export async function addCoinsToUser(formData: FormData) {
  const uid = formData.get('uid') as string
  const coinsToAdd = parseInt(formData.get('coins') as string)

  if (!uid || isNaN(coinsToAdd)) {
    return { error: "Invalid user ID or coin amount" }
  }

  try {
    const userRef = db.ref(`users/${uid}`)
    const snapshot = await userRef.once('value')
    const userData = snapshot.val() || {}

    const currentCoins = userData.coins || 0
    const newCoins = currentCoins + coinsToAdd

    await userRef.update({
      coins: newCoins,
      totalEarned: (userData.totalEarned || 0) + coinsToAdd
    })

    revalidatePath('/users')
    return { success: true, newCoins }
  } catch (error) {
    console.error('Error adding coins to user:', error)
    return { error: "Failed to add coins" }
  }
}

export async function setUserCoins(formData: FormData) {
  const uid = formData.get('uid') as string
  const newCoins = parseInt(formData.get('coins') as string)

  if (!uid || isNaN(newCoins) || newCoins < 0) {
    return { error: "Invalid user ID or coin amount" }
  }

  try {
    const userRef = db.ref(`users/${uid}`)
    await userRef.update({
      coins: newCoins
    })

    revalidatePath('/users')
    return { success: true, newCoins }
  } catch (error) {
    console.error('Error setting user coins:', error)
    return { error: "Failed to set coins" }
  }
}

export async function resetUserStats(formData: FormData) {
  const uid = formData.get('uid') as string

  if (!uid) {
    return { error: "Invalid user ID" }
  }

  try {
    const userRef = db.ref(`users/${uid}`)
    const snapshot = await userRef.once('value')
    const userData = snapshot.val() || {}

    await userRef.update({
      coins: 0,
      adsWatchedToday: 0,
      totalAdsWatched: 0,
      totalEarned: 0,
      lastAdWatch: null,
      lastAdWatchAsLog: null,
      lastRestDate: userData.lastRestDate || null
    })

    revalidatePath('/users')
    return { success: true }
  } catch (error) {
    console.error('Error resetting user stats:', error)
    return { error: "Failed to reset stats" }
  }
}

export async function getDeviceBindings() {
  try {
    const snapshot = await db.ref('device_bindings').once('value')
    const data = snapshot.val()
    return { deviceBindings: data || {} }
  } catch (error) {
    console.error('Error fetching device bindings:', error)
    return { error: "Failed to fetch device bindings" }
  }
}