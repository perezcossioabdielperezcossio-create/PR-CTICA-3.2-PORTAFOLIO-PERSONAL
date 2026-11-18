export async function registerMember(member) {
  const response = await fetch('/api/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(member)
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error)
  return result
}
