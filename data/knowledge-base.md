# ISSM Security Operations Platform — Knowledge Base

## Platform Overview

The ISSM Security Operations Platform is an integrated security management system designed for security companies operating in Pakistan. It manages Quick Reaction Force (QRF) teams, guard compliance, training, deployment, alerts, and provides AI-assisted intelligence for operators.

The platform serves security operations centers (SOCs) that manage armed response teams, guard forces, and site security across multiple locations — primarily in Islamabad, Rawalpindi, and surrounding areas.

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
