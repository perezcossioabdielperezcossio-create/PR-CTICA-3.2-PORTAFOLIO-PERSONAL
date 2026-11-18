import { validateMember } from '../domain/member.js'

export function createRegisterMember(members) {
  return input => {
    const member = validateMember(input)
    if (member.error) return { status: 'invalid', error: member.error }
    if (!members.add(member)) return { status: 'duplicate' }
    return { status: 'registered' }
  }
}
