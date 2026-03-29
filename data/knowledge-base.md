# ISSM Security Operations Platform — Knowledge Base

## Platform Overview

The ISSM Security Operations Platform is an integrated security management system designed for security companies operating in Pakistan. It manages Quick Reaction Force (QRF) teams, guard compliance, training, deployment, alerts, and provides AI-assisted intelligence for operators.

The platform serves security operations centers (SOCs) that manage armed response teams, guard forces, and site security across multiple locations — primarily in Islamabad, Rawalpindi, and surrounding areas.

---

## Project Data Index (AI Query Database)

Use this section as the primary source for count-based AI answers (today snapshots).

### Query Rules
- If user asks "how many obstructions happened today", use `obstructions_total_today`.
- If user asks "camera obstructions today", use `camera_obstructions_today`.
- If user asks "vehicle obstructions today", use `vehicle_obstructions_today_strict`.
- If user asks "vehicle security obstructions/violations today", use `vehicle_security_obstruction_events_today`.

### Today Snapshot (Mock Operational Day)
- `snapshot_date`: 2026-03-06
- `sites_active_total`: 5
- `active_modules_total`: 6

### Surveillance Events (Module: AI Surveillance Monitoring)
- `surveillance_live_events_total`: 4
- `camera_obstructions_today`: 1
- `unauthorized_entry_events_today`: 1
- `tailgating_events_today`: 1
- `suspicious_loitering_events_today`: 1

Event list (full fields for AI):
| # | Event title | Camera ID | Location | Time | Risk level |
|---|-------------|-----------|----------|------|------------|
| 1 | Suspicious Loitering | CAM-001 | Main Gate Entry | 14:23 | high |
| 2 | Camera Obstruction | CAM-005 | Production Facility | 14:18 | medium |
| 3 | Unauthorized Entry | CAM-006 | Restricted Compound | 14:11 | critical |
| 4 | Tailgating at Gate | CAM-001 | Main Gate Entry | 13:58 | high |

### Vehicle Access (Module: Access Monitoring)

**Aggregate metrics (facility / rolling window — dashboard cards):**
- `vehicle_metrics_total_entries_24h`: 124
- `vehicle_metrics_authorized_24h`: 71
- `vehicle_metrics_unauthorized_24h`: 17
- `vehicle_metrics_flagged_24h`: 12

**Complete sample log (matches Access Monitoring table — use this for driver names, plates, times):**

| Row ID | Driver | Plate | Vehicle type | Entry time | Purpose | Auth status |
|--------|--------|-------|--------------|------------|---------|-------------|
| 1 | John Mwangi | KAC 201M | Sedan | 06:15 | Staff | authorized |
| 2 | Alice Moraa | KDC 092L | SUV | 06:30 | Staff | authorized |
| 3 | Peter Ndungu | KCJ 551X | Truck | 07:15 | Delivery | authorized |
| 4 | Mary Wanjiru | KDB 449A | Sedan | 07:30 | Visitor | authorized |
| 5 | Ahmed Said | KBN 112W | Pickup | 07:45 | Contractor | authorized |
| 6 | James Kariuki | KBQ 773Y | Bus | 08:15 | Staff Transport | authorized |
| 7 | Fatima Omar | KCW 901P | Sedan | 08:30 | VIP | authorized |
| 8 | Robert Ouma | KBB 514L | Truck | 09:00 | Delivery | authorized |
| 9 | Unknown | KDA 112C | Van | 09:12 | Unknown | unauthorized |
| 10 | Unknown | KAA 555H | Motorcycle | 09:25 | Unknown | unauthorized |
| 11 | David Kimani | KDB 9981 | SUV | 09:40 | Visitor | flagged |
| 12 | Unknown | KCF 299Q | Sedan | 10:05 | Unknown | unauthorized |
| 13 | Sarah Lee | KCG 177U | Van | 10:15 | Contractor | flagged |
| 14 | Unknown | KCH 900X | Motorcycle | 10:30 | Unknown | unauthorized |

**Unauthorized vehicles only (sample log — 4 rows):**
1. Driver: Unknown — Plate: KDA 112C — Type: Van — Time: 09:12 — Purpose: Unknown
2. Driver: Unknown — Plate: KAA 555H — Type: Motorcycle — Time: 09:25 — Purpose: Unknown
3. Driver: Unknown — Plate: KCF 299Q — Type: Sedan — Time: 10:05 — Purpose: Unknown
4. Driver: Unknown — Plate: KCH 900X — Type: Motorcycle — Time: 10:30 — Purpose: Unknown

**Flagged / under review (sample log — 2 rows):**
1. Driver: David Kimani — Plate: KDB 9981 — Type: SUV — Time: 09:40 — Purpose: Visitor — Status: flagged
2. Driver: Sarah Lee — Plate: KCG 177U — Type: Van — Time: 10:15 — Purpose: Contractor — Status: flagged

**Access Alerts sidebar (6 items):**
| Alert ID | Title | Details line | Type |
|----------|-------|----------------|------|
| 1 | Unauthorized Vehicle | KDA 112C • Unknown • Van | unauthorized |
| 2 | Unauthorized Vehicle | KAA 555H • Unknown • Motorcycle | unauthorized |
| 3 | Under Review | KDB 9981 • Unknown • SUV | flagged |
| 4 | Unauthorized Vehicle | KCF 299Q • Unknown • Sedan | unauthorized |
| 5 | Under Review | KCG 177U • Unknown • Van | flagged |
| 6 | Unauthorized Vehicle | KCH 900X • Unknown • Motorcycle | unauthorized |

Counts for sample log:
- `vehicle_entries_sample_total`: 14
- `vehicle_entries_authorized_sample`: 8
- `vehicle_entries_unauthorized_sample`: 4
- `vehicle_entries_flagged_sample`: 2

Vehicle alerts:
- `vehicle_alerts_total`: 6
- `vehicle_alerts_unauthorized`: 4
- `vehicle_alerts_under_review`: 2

Vehicle obstruction counters (semantic):
- `vehicle_obstructions_today_strict`: 0
- `vehicle_security_obstruction_events_today`: 4 (treat as unauthorized vehicle events in sample log when user asks about vehicle violations)

### Combined Obstruction Counters (Cross-module)
- `obstructions_total_today`: 1
- `obstructions_breakdown_today`: camera=1, vehicle_strict=0
- `obstructions_operational_breakdown_today`: camera=1, vehicle_security=4
- `obstructions_operational_total_today`: 5

### QRF Response (Module: Threat Response)
- `qrf_teams_total`: 5
- `qrf_teams_available`: 5
- `qrf_incidents_total`: 6
- `qrf_incidents_pending`: 2
- `qrf_incidents_dispatched`: 1
- `qrf_incidents_resolved`: 3

QRF teams:
- QRF-A (ALPHA-1): Toyota Hilux, available
- QRF-B (BRAVO-1): Land Cruiser, available
- QRF-C (CHARLIE-1): Hilux (Medical), available
- QRF-D (DELTA-1): Armoured APC, available
- QRF-E (ECHO-1): Motorcycle Unit, available

**QRF incidents (full list for detailed answers):**

| Incident ID | Type | Site | Reported | Status | Required capability | Assigned team |
|-------------|------|------|----------|--------|---------------------|---------------|
| INC-047 | Code Amber | Site Bravo (F-6 Markaz) | 14:28 PKT | pending | armed | (none yet) |
| INC-046 | Code Red | Site Delta (I-8 Industrial) | 13:58 PKT | pending | armed | (none yet) |
| INC-045 | Code Blue | Site Alpha (Blue Area) | 13:15 PKT | dispatched | medical | QRF-C |
| INC-044 | Code Green | Site Echo (G-9 Markaz) | 12:40 PKT | resolved | patrol | QRF-E |
| INC-043 | Code Amber | Site Charlie (DHA Phase 2) | 11:22 PKT | resolved | armed | QRF-A |
| INC-042 | Code Black | Site Bravo (F-6 Markaz) | 10:05 PKT | resolved | bomb_disposal | QRF-D |

### Guard Compliance (Module: Licence & Certification Monitoring)
- `guards_total`: 10
- `guards_verified`: 6
- `guards_expiring_soon`: 2
- `guards_expired`: 2

**Full guard roster (use for any guard-by-name or licence query):**

| Guard ID | Name | CNIC | Licence | Authority | Expiry | Status |
|----------|------|------|---------|-----------|--------|--------|
| G-001 | Ali Hassan | 3520212345678 | SEC-ISB-2024-0412 | Punjab Security | 2026-04-15 | verified |
| G-002 | Bilal Khan | 3520298765432 | SEC-ISB-2024-0287 | Punjab Security | 2026-04-07 | expiring_soon |
| G-003 | Usman Raza | 3520245678901 | SEC-ISB-2023-0891 | Punjab Security | 2026-03-28 | expiring_soon |
| G-004 | Farhan Ahmed | 3520267890123 | SEC-ISB-2023-0156 | Punjab Security | 2025-12-01 | expired |
| G-005 | Imran Malik | 3520223456789 | SEC-ISB-2024-0634 | Punjab Security | 2026-09-20 | verified |
| G-006 | Tariq Mehmood | 3520234567890 | SEC-ISB-2024-0445 | Punjab Security | 2026-07-12 | verified |
| G-007 | Naveed Shah | 3520256789012 | SEC-ISB-2024-0778 | Punjab Security | 2026-08-30 | verified |
| G-008 | Rizwan Abbas | 3520278901234 | SEC-ISB-2023-0923 | Punjab Security | 2026-01-15 | expired |
| G-009 | Kamran Yousuf | 3520201234567 | SEC-ISB-2024-0512 | Punjab Security | 2026-06-05 | verified |
| G-010 | Zafar Iqbal | 3520289012345 | SEC-ISB-2024-0199 | Punjab Security | 2026-04-02 | expiring_soon |

### Deployment (Module: Deployment & Reserve Pool)
- `deployments_active`: 6
- `reserve_pool_total`: 10
- `coverage_gaps_today`: 0
- `handovers_today`: 3

### Alerts Summary (Cross-module for assistant answers)
- `alerts_total_today`: 10
- `alerts_surveillance_events`: 4
- `alerts_vehicle_access`: 6
- `alerts_critical_surveillance`: 1
- `alerts_high_surveillance`: 2
- `alerts_medium_surveillance`: 1

### Example Answer Mapping (AI must always add full record lists, not counts alone)
- Q: "How many obstructions happened today?"  
  A: Give totals **and** list each surveillance event row (title, camera, location, time, level) from the Event list table.
- Q: "How many unauthorized vehicles today / list unauthorized cars?"  
  A: Give sample-log count (4) **and** list all four unauthorized rows with driver, plate, type, entry time, purpose. Mention aggregate dashboard metric (17 unauthorized in 24h) as facility context if relevant.
- Q: "How many camera obstructions happened today?"  
  A: Count (1) **and** full row for Camera Obstruction (CAM-005, Production Facility, 14:18, medium risk).

---

## Module 01: QRF Threat Response & Capability

### Purpose
Selects the best Quick Reaction Force (QRF) team based on threat type, team capability, and real-time GPS location. Dispatches the closest capable team to an incident.

### How It Works
1. QRF teams carry GPS-enabled devices that broadcast their position to the platform every 1–2 minutes.
2. When an incident is logged, the system filters teams by required capabilities (armed, dog unit, medical, bomb disposal).
3. Eligible teams are ranked by distance from the incident using the Haversine formula.
4. The operator dispatches the top-ranked team from the dashboard.
5. Team status updates flow back: EN_ROUTE → ON_SCENE → SECURE → REPORT_SUBMITTED.

### Active QRF Teams
- **QRF Alpha**: Armed response, 4 personnel, Toyota Hilux. Callsign: ALPHA-1. Sector: F-6/F-7.
- **QRF Bravo**: Armed response + K9 unit, 5 personnel, Toyota Land Cruiser. Callsign: BRAVO-1. Sector: G-8/G-9.
- **QRF Charlie**: Medical + armed response, 4 personnel, Toyota Hilux (medical kit). Callsign: CHARLIE-1. Sector: I-8/I-9.
- **QRF Delta**: Bomb disposal + armed response, 6 personnel, Armoured vehicle. Callsign: DELTA-1. Sector: E-7/Blue Area.
- **QRF Echo**: Rapid patrol, 3 personnel, Motorcycle unit. Callsign: ECHO-1. Sector: G-10/G-11.

### Incident Types
- **Code Red**: Confirmed armed intrusion. Requires armed response.
- **Code Amber**: Suspicious activity or unverified alarm. Requires armed patrol.
- **Code Blue**: Medical emergency at site. Requires medical team.
- **Code Black**: Bomb threat or IED. Requires bomb disposal unit.
- **Code Green**: Routine check or false alarm verification.

### Response Time Targets
- Code Red: Under 8 minutes
- Code Amber: Under 12 minutes
- Code Blue: Under 10 minutes
- Code Black: Under 15 minutes (specialized unit)
- Code Green: Under 20 minutes

---

## Module 02: Guard Compliance Monitoring

### Purpose
Ensures only verified, licensed guards are deployed. Tracks CNIC, licence validity, issuing authority, and certification expiry. Blocks expired guards from assignment.

### Compliance Rules
- Every guard must have a valid CNIC (13-digit Pakistani national ID).
- Security licence must be issued by a recognized authority and not expired.
- Guards are checked at every deployment assignment — expired licence = hard block.
- 30-day warning window before expiry triggers renewal workflow.
- Supervisor override for expired guard creates an audit entry.

### Guard Statuses
- **Verified**: All documents valid. Can be deployed.
- **Expiring Soon**: Licence expires within 30 days. Warning shown.
- **Expired**: Licence has expired. Cannot be deployed without supervisor override.
- **Suspended**: Manually suspended by admin. Cannot be deployed.
- **Under Review**: Documents submitted, awaiting verification.

---

## Module 03: Guard Training Management

### Purpose
Tracks guard training records, certifies eligibility for specific posts, and alerts when certifications approach expiry.

### Training Types
- **Armed Response (AR)**: Weapons handling, rules of engagement. Validity: 12 months.
- **First Aid (FA)**: Basic medical response. Validity: 24 months.
- **Fire Safety (FS)**: Fire extinguisher use, evacuation procedures. Validity: 12 months.
- **CCTV Operation (CCTV)**: Surveillance monitoring, recording management. Validity: 24 months.
- **Access Control (AC)**: Gate management, ID verification, visitor logs. Validity: 12 months.
- **K9 Handling (K9)**: Dog unit operations. Validity: 12 months.
- **VIP Protection (VIP)**: Close protection protocols. Validity: 6 months.
- **Bomb Awareness (BA)**: IED recognition, evacuation protocols. Validity: 12 months.

### Training Expiry Rules
- 45-day warning window before expiry.
- Expired training makes guard ineligible for posts requiring that module.
- Training snapshot captured at deployment time for audit purposes.

---

## Module 04: Guard Deployment & Reserve Pool

### Purpose
Manages active guard deployments across all sites and maintains a reserve (jump) pool for rapid replacement.

### Deployment Rules
- Guards must be compliance-verified (Module 02) and hold all required training (Module 03) for the post.
- No-gap rule: replacement deployment start time must be ≤ original deployment end time.
- Coverage gaps require supervisor acknowledgement and are logged.
- Reserve pool guards are ordered by proximity to site.

### Active Sites
- **Site Alpha (Blue Area)**: Corporate HQ. 12 guards, 3 shifts. Requires: AR, AC, CCTV.
- **Site Bravo (F-6 Markaz)**: Commercial complex. 8 guards, 2 shifts. Requires: AR, FA, AC.
- **Site Charlie (DHA Phase 2)**: Residential compound. 6 guards, 3 shifts. Requires: AR, FA, FS.
- **Site Delta (I-8 Industrial)**: Warehouse complex. 4 guards, 2 shifts. Requires: AR, AC, CCTV.
- **Site Echo (G-9 Markaz)**: Retail centre. 10 guards, 2 shifts. Requires: AC, FA, FS, CCTV.

---

## Module 05: WhatsApp Alert System

### Purpose
Sends automated and manual alerts via WhatsApp for incidents, compliance warnings, deployment changes, and escalations.

### Alert Types
- **Incident Alert**: Triggered by new incident. Sent to duty manager + QRF lead.
- **Compliance Warning**: Guard licence expiring. Sent to admin.
- **Training Expiry**: Guard training lapsing. Sent to training admin.
- **Coverage Gap**: Post left uncovered. Sent to duty supervisor.
- **Escalation**: Alert not acknowledged within deadline. Sent to next in chain.

### Escalation Chain
1. First recipient (5 min deadline)
2. Shift supervisor (5 min deadline)
3. Duty manager (10 min deadline)
4. Operations director (no deadline — final escalation)

### Delivery Tracking
All messages are tracked: Sent → Delivered → Read. Failed deliveries trigger retry, then escalation.

---

## Module 06: AI Chat Assistant

### Purpose
Allows operators to query system data using plain English. Translates natural language into data queries and returns summarized answers.

### Example Queries
- "Which guards on Site Alpha expire this month?"
- "Show all open incidents from last night"
- "Which QRF team is closest to Sector F-7?"
- "How many guards are trained in armed response?"
- "List all coverage gaps this week"
- "What's the average QRF response time for Code Red incidents?"

### Proactive Suggestions
During active incidents, the AI monitors and suggests:
- Stale QRF locations (no update in 10+ minutes)
- Recurring alarm patterns at a site
- Guards approaching shift end during an incident
- Nearby QRF teams that could assist

---

## Standard Operating Procedures

### Incident Response SOP
1. Alarm received → Operator verifies via CCTV (if available)
2. Incident created with threat classification
3. System ranks QRF teams by distance + capability
4. Operator dispatches nearest capable team
5. QRF acknowledges → EN_ROUTE status
6. QRF arrives → ON_SCENE status
7. Situation resolved → SECURE status
8. Report and photos submitted → CLOSED

### Guard Shift Change SOP
1. Outgoing guard logs end-of-shift report
2. Incoming guard scanned/verified at post
3. Handover checklist completed (keys, equipment, incident log)
4. System confirms overlap — no coverage gap
5. New deployment record activated

### Emergency Escalation SOP
1. Code Red or Code Black → Immediate alert to all supervisors
2. If no QRF acknowledgement in 3 minutes → Alert duty manager
3. If no resolution in 15 minutes → Alert operations director
4. All escalations logged with timestamps

---

## Key Metrics

- **Average QRF Response Time**: Target < 8 min for Code Red
- **Guard Compliance Rate**: Target > 95% verified at all times
- **Training Currency**: Target > 90% guards fully trained
- **Coverage Gap Rate**: Target < 2% of total guard-hours
- **Alert Delivery Rate**: Target > 99% delivered within 30 seconds
- **AI Query Accuracy**: Target > 85% correct query interpretation
