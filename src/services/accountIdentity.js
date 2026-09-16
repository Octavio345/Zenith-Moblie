import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore"
import { db } from "./firebase"

export const normalizeAccountDocument = (value) => String(value || "").replace(/\D/g, "")
export const normalizeAccountPhone = (value) => String(value || "").replace(/\D/g, "")

export const maskAccountDocument = (value) => {
  const digits = normalizeAccountDocument(value)
  return digits.length === 11
    ? `***.***.***-${digits.slice(-2)}`
    : `**.***.***/****-${digits.slice(-2)}`
}

export const maskAccountPhone = (value) => {
  const digits = normalizeAccountPhone(value)
  return digits.length >= 10
    ? `(${digits.slice(0, 2)}) *****-${digits.slice(-4)}`
    : "Telefone protegido"
}

async function identifierId(kind, value) {
  const bytes = new TextEncoder().encode(`zenith:spark:v1:${kind}:${value}`)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return `${kind}_${Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, "0")
  ).join("")}`
}

function duplicateError(kind) {
  const error = new Error("Identificador já cadastrado.")
  error.code = kind === "phone"
    ? "account/phone-already-in-use"
    : "account/document-already-in-use"
  return error
}

export async function createProfileWithUniqueIdentifiers({
  profileCollection,
  userId,
  profileData,
}) {
  const documentValue = normalizeAccountDocument(profileData.document)
  const phone = normalizeAccountPhone(profileData.phone)
  const safeProfile = { ...profileData }
  delete safeProfile.document
  delete safeProfile.phone

  const identities = [
    ["document", documentValue],
    ...(phone ? [["phone", phone]] : []),
  ]
  const claimIds = await Promise.all(
    identities.map(([kind, value]) => identifierId(kind, value))
  )
  const profileRef = doc(db, profileCollection, userId)
  const claimRefs = claimIds.map((id) => doc(db, "accountIdentifiers", id))

  await runTransaction(db, async (transaction) => {
    const [profileSnapshot, ...claimSnapshots] = await Promise.all([
      transaction.get(profileRef),
      ...claimRefs.map((reference) => transaction.get(reference)),
    ])

    if (profileSnapshot.exists()) {
      const error = new Error("Esta conta já possui um perfil.")
      error.code = "account/profile-already-exists"
      throw error
    }

    claimSnapshots.forEach((snapshot, index) => {
      if (snapshot.exists() && snapshot.data()?.userId !== userId) {
        throw duplicateError(identities[index][0])
      }
    })

    transaction.set(profileRef, {
      ...safeProfile,
      documentMasked: maskAccountDocument(documentValue),
      documentLast4: documentValue.slice(-4),
      ...(phone
        ? {
            phoneMasked: maskAccountPhone(phone),
            phoneLast4: phone.slice(-4),
          }
        : {}),
      identityProtectionVersion: "spark-v1",
    })

    claimRefs.forEach((reference, index) => {
      if (claimSnapshots[index].exists()) return
      transaction.set(reference, {
        userId,
        ownerId: safeProfile.ownerId || userId,
        kind: identities[index][0],
        profileCollection,
        createdAt: serverTimestamp(),
      })
    })
  })
}

export async function attachUniquePhoneToProfile({
  profileCollection = "owners",
  userId,
  phone,
}) {
  const phoneValue = normalizeAccountPhone(phone)
  const claimId = await identifierId("phone", phoneValue)
  const profileRef = doc(db, profileCollection, userId)
  const claimRef = doc(db, "accountIdentifiers", claimId)

  await runTransaction(db, async (transaction) => {
    const [profile, claim] = await Promise.all([
      transaction.get(profileRef),
      transaction.get(claimRef),
    ])

    if (!profile.exists()) throw new Error("Perfil não encontrado.")
    if (claim.exists() && claim.data()?.userId !== userId) {
      throw duplicateError("phone")
    }

    transaction.set(profileRef, {
      phoneMasked: maskAccountPhone(phoneValue),
      phoneLast4: phoneValue.slice(-4),
      identityProtectionVersion: "spark-v1",
      updatedAt: new Date().toISOString(),
    }, { merge: true })

    if (!claim.exists()) {
      transaction.set(claimRef, {
        userId,
        ownerId: profile.data()?.ownerId || userId,
        kind: "phone",
        profileCollection,
        createdAt: serverTimestamp(),
      })
    }
  })
}

export async function getOwnerFarmIds(ownerId) {
  if (!ownerId) return []
  const farms = await getDocs(
    query(collection(db, "farms"), where("ownerId", "==", ownerId))
  )
  return farms.docs.map((farm) => farm.id)
}

export function accountIdentifierMessage(error) {
  if (error?.code === "account/document-already-in-use") {
    return "Este CPF ou CNPJ já está cadastrado em outra conta."
  }
  if (error?.code === "account/phone-already-in-use") {
    return "Este número de telefone já está cadastrado em outra conta."
  }
  if (error?.code === "auth/email-already-in-use") {
    return "Este email já está cadastrado em outra conta."
  }
  if (error?.code === "permission-denied" || error?.code === "firestore/permission-denied") {
    return "Não foi possível validar os dados. Atualize a página e tente novamente."
  }
  return ""
}
