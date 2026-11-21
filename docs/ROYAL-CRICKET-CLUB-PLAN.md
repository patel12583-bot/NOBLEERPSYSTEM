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


## Detailed live cricket scoring (score-app style)
The scoring center is a first-class module, designed for local club matches and phone use at the ground.

### Match setup and toss
- Select home/away teams, match date, venue, format (T10/T20/ODI/Test/custom) and scheduled overs.
- Select playing XI/squad, captain, wicketkeeper, umpires and scorer.
- Toss winner and decision (bat/bowl); choose innings start batters and opening bowler.
- Support friendly matches and tournament fixtures.

### Ball-by-ball scorer console
- Large, fast-tap controls for 0, 1, 2, 3, 4, 5 and 6 runs.
- Extras: wides, no-balls, byes, leg-byes and penalty runs, with configurable local rules.
- Wicket flow: select dismissal type, dismissed batter and fielder where relevant; support bowled, caught, caught behind, caught & bowled, LBW, stumped, run out, hit wicket, retired hurt and retired out.
- Automatically calculate legal balls, overs, striker rotation, batter runs/balls, bowler figures, extras, fall of wickets, run rate and required run rate.
- Manual strike change, batter/bowler replacement, retired batter handling, innings end/declare and match end.
- Powerplay/over limits and configurable tennis-ball or gully-cricket rules.
- Undo last ball, edit a past delivery, add scorer notes and keep a full audit trail for corrections.
- Save every delivery immediately; allow scorer to leave and resume a match, including from another signed-in device.

### Live match centre and scorecard
- Live score, wickets, overs, target, runs required, balls remaining, CRR/RRR and current partnership.
- Current batters and bowler cards with individual figures.
- Ball-by-ball commentary/timeline and over-by-over summary.
- Full batting, bowling and fall-of-wickets scorecards for each innings.
- Match result, player of the match, best batter and best bowler.
- Spectator-friendly read-only live score page and shareable match link; scoring/edit controls remain behind scorer permissions.
- Real-time updates without manual page refresh.

### Match analytics and player records
- Batting: runs, balls, fours, sixes, strike rate, average and high score.
- Bowling: overs, maidens, runs, wickets, economy, average and strike rate.
- Partnerships, innings run-rate chart, over-by-over Manhattan chart and worm chart.
- Optional advanced shot map (wagon wheel) and pitch map when the scorer records shot/line/length locations.
- Season and tournament leaderboards; statistics derived from validated ball events.

### Reliability and permissions
- Only assigned SCORER, ADMIN or SUPER_ADMIN can enter/edit a score.
- Members can follow live scores and view completed scorecards; no member can change match data unless assigned scorer permissions.
- Scoring actions must be transaction-safe and idempotent to prevent duplicate ball entries on slow connections.
- Provide clear connection/sync state and a safe retry path. Offline-first scoring is a later enhancement and must sync without duplicating deliveries.
- Do not copy another app's branding, screen assets or proprietary code; implement familiar cricket scoring workflows with original Royal Cricket Club UI.

### Later optional enhancements
- Live video/streaming and scoreboard overlays (requires streaming/overlay infrastructure).
- Push notifications for wickets, innings breaks, match start and result.
- DLS/revised-target calculator and advanced umpire/official tools after core scoring is stable.

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

## Implementation progress — first working milestone

### Added to the feature branch
- Royal Cricket Club branded login for both administrators and members.
- Public member registration creates a MEMBER account with a bcrypt-hashed password and a unique RCC member code.
- Sign-in accepts email or RCC member code; sessions use the existing server-side hashed-token cookie flow.
- Authenticated dashboard supports ADMIN, SUPER_ADMIN, TREASURER, SCORER and MEMBER roles.
- Signed-in member directory with search by name, member code, phone or email.
- Workspace sign-out action.
- Additive SQL migration adds the three club roles and MemberProfile table; it does not drop or rewrite existing Noble tables.

### Required before testing against Neon
The migration has been committed as `prisma/migrations/20261121090000_royal_member_foundation/migration.sql`, but it has NOT been applied to the live Neon database. Review and back up the database first, then apply this SQL in the intended Royal Cricket Club database. Do not apply it to the active Noble production database until the cutover is approved. The current Vercel production deployment is not changed by this feature branch until the PR is merged/deployed.

### Not implemented yet
- Admin-only member approval, member editing and role assignment.
- Finance collections/expenses/ledger database workflows.
- Match setup, ball-by-ball scoring and live score updates.
- Automated build/deployment verification and production database migration.
