import { validateMember } from '../domain/member.js'

export function createRegisterMember(members) {
  return input => {
    const member = validateMember(input)
    if (member.error) return { status: 'invalid', error: member.error }
    const registeredAt = members.add(member)
    if (!registeredAt) return { status: 'duplicate' }
    return { status: 'registered', member: { ...member, registeredAt } }
  }
}
