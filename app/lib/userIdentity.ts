type UserLike = {
  email?: string | null
}

export function normalizeUserIdentity(email: string) {
  return email.trim().toLowerCase()
}

export function getUserIdentityFromAuthUser(user: UserLike | null | undefined) {
  const email = user?.email
  if (!email) return null

  return normalizeUserIdentity(email)
}

export function requireUserIdentityFromAuthUser(user: UserLike | null | undefined) {
  const userIdentity = getUserIdentityFromAuthUser(user)

  if (!userIdentity) {
    throw new Error("Authenticated user is missing an email address")
  }

  return userIdentity
}
