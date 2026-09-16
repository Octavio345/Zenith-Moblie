import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "./firebase"

export const ACCOUNT_ROLES = {
  ADMIN: "admin",
  EMPLOYEE: "employee",
  COLLABORATOR: "collaborator",
}

export function normalizeRole(role) {
  if (role === ACCOUNT_ROLES.EMPLOYEE) return ACCOUNT_ROLES.EMPLOYEE
  if (role === ACCOUNT_ROLES.COLLABORATOR) return ACCOUNT_ROLES.COLLABORATOR
  return ACCOUNT_ROLES.ADMIN
}

export function isOperationalRole(role) {
  const normalizedRole = normalizeRole(role)
  return normalizedRole === ACCOUNT_ROLES.EMPLOYEE || normalizedRole === ACCOUNT_ROLES.COLLABORATOR
}

export function isAccountBlocked(profile) {
  return profile?.archived === true || profile?.accessStatus === "blocked"
}

export function getRoleHomePath(role) {
  return isOperationalRole(role)
    ? "/funcionarios"
    : "/home"
}

export async function getUserAccessProfile(uid) {
  if (!uid) return null

  for (const profileCollection of ["owners", "employees", "users"]) {
    const userSnap = await getDoc(doc(db, profileCollection, uid))
    if (!userSnap.exists()) continue

    const data = userSnap.data()

    if (profileCollection === "users") {
      const targetCollection = isOperationalRole(data.role) ? "employees" : "owners"

      try {
        const { document, phone, ...safeData } = data
        await setDoc(doc(db, targetCollection, uid), safeData)
        await deleteDoc(doc(db, "users", uid))
        return {
          id: uid,
          ...safeData,
          profileCollection: targetCollection,
          role: normalizeRole(data.role),
        }
      } catch {
        // Compatibilidade temporária para contas antigas ainda não migradas.
      }
    }

    return {
      id: userSnap.id,
      ...data,
      profileCollection,
      role: normalizeRole(data.role),
    }
  }

  return null
}
