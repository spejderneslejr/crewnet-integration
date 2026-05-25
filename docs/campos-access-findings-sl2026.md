# CampOS API Access Findings — SL2026

Tested against the SL2026 CampOS instance using the `campos:checkAccess` CLI command.

## Summary

| Check | Status | Notes |
|-------|--------|-------|
| Connectivity (`common.version`) | ✅ | Server version 15.0 |
| `member.profile` — basic fields | ✅ | |
| `member.profile` — `image` field | ❌ | Field does not exist on this model |
| `member.profile` — `crewnet_user` field | ❌ | Field does not exist (see below) |
| `hr.competence` | ❌ | Access denied (see below) |
| `member.organization` | ✅ | |
| `project.task` | ❌ | Model does not exist (see below) |
| `res.partner` | ✅ | |

---

## Issues & Resolutions

### 1. `crewnet_user` field removed from `member.profile` ⚠️ Breaking change

In SL2022 a custom `crewnet_user` field on `member.profile` stored the CrewNet user ID for each
member, used to build the CampOS partner ID ↔ CrewNet user ID mapping that all three scheduled
sync tasks depend on.

This field no longer exists in the SL2026 instance.

**Resolution — new matching strategy:**
CrewNet users that were created by the integration have a synthetic email
`{odoo_uid}@crewnet.sl2026.dk` set **on the CrewNet side only** — this email does not exist
in CampOS.

The mapping is built by:
1. Fetching all CrewNet users (`usersGet()`) and filtering those whose email matches
   `@crewnet.sl2026.dk` — the numeric prefix is the Odoo UID of the corresponding CampOS user
2. Querying CampOS `res.users` with `id in [list of odoo_uids]` to retrieve `partner_id`
3. Joining in memory: `crewnet_user_id ↔ odoo_uid ↔ campos_partner_id`

Note: the old code in `getCampOSUserMapping` already had this as a fallback
(`/^(\d+)@crewnet.sl2022.dk$/`), so the pattern is established — the domain just needs
updating to `sl2026` and made the primary strategy.

**Code changes needed (to be done separately):**
- `memberWithCrewnetIdData()` — replace `crewnet_user` field query with `res.users` lookup by email
- `getCrewnetIdToCamposPartnerId()` — same replacement
- `getCampOSUserMapping()` in `crewnet.service.ts` — update domain from `sl2022` to `sl2026`
  and remove the now-redundant `crewnet_user` primary path

---

### 2. `project.task` model does not exist ⚠️ Feature removed

The guest helper sync (`syncGuestHelpers`) used a CampOS project (hardcoded id=6) where each task
represented an external non-member volunteer assigned to an udvalg. The `project` module is not
installed on the SL2026 instance.

**Resolution:** The guest helper concept no longer exists for SL2026. The following can be
removed or disabled:
- `getGuestHelperPartners()` in `campos.service.ts`
- `syncGuestHelpers()` in `campctl.service.ts`
- `SyncGuestHelpers` CLI command
- `syncGuestHelpers` scheduled task in `scheduledTasks.ts`

---

### 3. `image` field missing from `member.profile` ℹ️ Low impact

The `image` field was used by `memberByFilter()` → `memberByMemberNumber()` →
`general:generateLicenseSheet` to embed member photos in the licence sheet output.

This field is not present on `member.profile` in the SL2026 instance.

**Impact:** Only affects the `general:generateLicenseSheet` CLI command (photo column will be
empty/broken). Does not affect any scheduled sync tasks.

---

### 4. `hr.competence` — access denied ℹ️ Low impact

The API user lacks the *Recruitment/Administrator* or *Recruitment/Officer* role required to
read `hr.competence` records.

This model is only used by `general:generateLicenseSheet` to read driving licences and other
competences for licence card generation.

**Resolution:** Either:
- Grant the API user one of the required roles in CampOS, if licence sheet generation is still
  needed for SL2026
- Or accept that `general:generateLicenseSheet` is not available and remove/disable it

---

## Configuration notes

- All CampOS API calls must include `allowed_company_ids: [2]` in the context — without this,
  calls fail with "Record does not exist" even for a valid user
- `odoo_uid` in `.env` must be the Odoo internal user ID (integer from `common.authenticate`),
  **not** the member number
- The `campos:getUid <username> <password>` CLI command can be used to retrieve the correct UID
