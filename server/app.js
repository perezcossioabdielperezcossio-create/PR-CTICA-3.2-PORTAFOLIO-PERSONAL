import { createRegisterMember } from './application/register-member.js'
import { createHttpApp } from './http/create-http-app.js'
import { openSqliteMembers } from './infrastructure/sqlite-members.js'

export function createApp({ database = ':memory:', assets } = {}) {
  const members = openSqliteMembers(database)
  const app = createHttpApp({
    registerMember: createRegisterMember(members),
    checkHealth: members.checkHealth,
    assets
  })
  return { app, close: members.close }
}
