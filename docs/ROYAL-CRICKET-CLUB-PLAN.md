# Royal Cricket Club Management App

## Locked decisions
- Club: Royal Cricket Club
- Theme: Light white + cricket green
- Login: Admin and every member
- Finance: all signed-in members can view the complete club ledger
- Writes: restricted by role; finance corrections use reversals/adjustments, not silent deletion
- Stack: Next.js App Router, Neon PostgreSQL, Prisma, GitHub, Vercel

## Routes
- Public: /, /login, /register, /forgot-password
- Workspace: /dashboard
- Team: /club/members, /club/attendance
- Finance: /club/collections, /club/expenses, /club/transactions, /club/reports
- Cricket: /club/matches, /club/scoring, /club/tournaments, /club/statistics
- Community: /club/notices, /club/settings

## Roles
- SUPER_ADMIN: system owner and all configuration
- ADMIN: club-wide management
- TREASURER: collections, expenses, receipts and finance reports
- SCORER: match setup and scoring
- MEMBER: read all club finance and club information; update own profile

## Planned data models
User, MemberProfile, Club, ClubMembership, Season, Match, MatchSquad, Innings, BallEvent, PlayerMatchStats, Tournament, TournamentTeam, Fixture, PointsTableEntry, Contribution, Expense, ExpenseAttachment, FinanceCategory, Attendance, Notice, AuditLog, InvitationToken, PasswordResetToken.

## Finance rules
- Balance = confirmed collections - approved expenses.
- Collections link to a member, payment method, date and receipt/reference.
- Expenses include category, payee, amount, description, creator and optional receipt.
- Every financial change is auditable; no silent deletion.
- All signed-in members can read the ledger; only authorised roles can write.
- Currency: INR.

## Milestones
1. Brand reset, light theme, public landing and workspace shell.
2. Authentication roles and member onboarding.
3. Member directory and finance ledger.
4. Collections, expenses, receipts and reports.
5. Matches, squads, attendance and results.
6. Live scoring, tournaments and player statistics.
7. Security review, responsive QA and Vercel deployment.

## Migration safety
Keep the existing Noble production app and database intact until the Cricket app builds and passes review. Back up Neon data before any schema cutover. Never put secrets in source code or client bundles.
