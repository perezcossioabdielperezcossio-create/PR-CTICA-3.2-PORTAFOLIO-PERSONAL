import { createAccountRoutes } from './http/account-routes.js'
import { createListMembers } from './application/list-members.js'
import { createRegisterMember } from './application/register-member.js'
import { createHttpApp } from './http/create-http-app.js'
import { openSqliteMembers } from './infrastructure/sqlite-members.js'

export function createApp({ database = ':memory:', assets, adminKey = process.env.GYM_ADMIN_KEY } = {}) {
  const members = openSqliteMembers(database)
  const app = createHttpApp({
    accountRoutes: createAccountRoutes(members.accounts, adminKey),
    registerMember: createRegisterMember(members),
    listMembers: createListMembers(members),
    checkHealth: members.checkHealth,
    assets
  })
  return { app, close: members.close }
}
