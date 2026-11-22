function normalizeSearch(value) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

export function createListMembers(repository) {
  return query => {
    const members = repository.list()
    const term = normalizeSearch(query.trim())
    if (!term) return members

    return members.filter(({ name, email }) =>
      normalizeSearch(name).includes(term) || normalizeSearch(email).includes(term)
    )
  }
}
