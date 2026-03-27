"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  ShieldCheck,
  MapPin,
  Activity,
  Radio,
  MessageCircle,
  Smartphone,
  Landmark,
  Clock,
  ChevronDown,
  ChevronUp,
  Construction,
  Crosshair,
  CarFront,
  CloudRain,
  Plane,
  Monitor,
  Zap,
  Flame,
  Eye,
  Package,
  Anchor,
  Wind,
  Users,
  Flag,
  Heart,
  Mountain,
  Truck,
  WifiOff,
  Shield,
  Target
} from "lucide-react";

export type ThreatLevel = "critical" | "high" | "medium" | "low";

const threats = [
  {
    id: "TRT-001",
    title: "Civil Unrest",
    location: "@ 2km North of Embassy Perimeter",
    level: "critical" as ThreatLevel,
    icon: Users,
    iconColor: "text-tactical-red",
    description: "Large-scale civil unrest reported near embassy district. Approximately 500 protesters moving towards diplomatic quarter. Tear gas deployed by local police.",
    time: "14:00",
    source: "Local Intelligence Network",
    sourceColor: "text-tactical-red",
    platform: "social media",
    posture: "Evacuate non-essential personnel. Standby QRF units. Reinforce perimeter gates."
  },
  {
    id: "TRT-002",
    title: "Road Closure",
    location: "@ Main Highway A2 - Embassy Access Route",
    level: "medium" as ThreatLevel,
    icon: Construction,
    iconColor: "text-tactical-cyan",
    description: "Major road closure affecting primary VIP convoy routes. Alternative routes may be compromised. Expected to last 4-6 hours.",
    time: "13:45",
    source: "Traffic Intelligence Feed",
    sourceColor: "text-tactical-cyan",
    platform: "gov",
    posture: "Notify convoy teams. Activate alternate route plans. Increase mobile patrol coverage."
  },
  {
    id: "TRT-003",
    title: "Kidnapping Risk",
    location: "@ Sector 7 - Industrial District",
    level: "high" as ThreatLevel,
    icon: Crosshair,
    iconColor: "text-tactical-amber",
    description: "Increased kidnapping risk reported in nearby industrial sector. Two incidents in last 48 hours targeting foreign nationals.",
    time: "13:30",
    source: "Regional Security Advisory",
    sourceColor: "text-tactical-amber",
    platform: "champ",
    posture: "Issue travel advisory. Restrict movement of key personnel. Standby extraction."
  },
  {
    id: "TRT-004",
    title: "Traffic Disruption",
    location: "@ City Centre - 5km radius",
    level: "low" as ThreatLevel,
    icon: CarFront,
    iconColor: "text-tactical-green",
    description: "Major sporting event causing significant traffic disruption. Expected 50,000 attendees. Stadium 3km from facility.",
    time: "13:15",
    source: "Public Events Monitor",
    sourceColor: "text-tactical-green",
    platform: "gov",
    posture: "Monitor traffic updates. Delay non-urgent transport logistics."
  },
  {
    id: "TRT-005",
    title: "Flood Risk",
    location: "@ Southern Access Road",
    level: "high" as ThreatLevel,
    icon: CloudRain,
    iconColor: "text-tactical-amber",
    description: "Heavy rainfall warning issued. Southern access road historically floods during heavy rain. May impact emergency evacuation routes.",
    time: "13:00",
    source: "Weather Intelligence Service",
    sourceColor: "text-tactical-amber",
    platform: "gov",
    posture: "Identify secondary evacuation paths. Stockpile emergency water barriers."
  },
  {
    id: "TRT-006",
    title: "Drone Activity",
    location: "@ Airspace above facility",
    level: "critical" as ThreatLevel,
    icon: Plane,
    iconColor: "text-tactical-red",
    description: "Unauthorized drone detected conducting reconnaissance patterns over facility airspace. Second occurrence this week.",
    time: "12:45",
    source: "Airspace Monitoring System",
    sourceColor: "text-tactical-red",
    platform: "tap",
    posture: "Activate C-UAS jamming equipment. Report to aviation authorities."
  },
  {
    id: "TRT-007",
    title: "Cyber Threat",
    location: "@ Internal Network",
    level: "high" as ThreatLevel,
    icon: Monitor,
    iconColor: "text-tactical-amber",
    description: "Increased phishing attempts targeting facility staff email accounts. Pattern consistent with state-sponsored APT group.",
    time: "12:30",
    source: "Cyber Threat Intelligence",
    sourceColor: "text-tactical-cyan",
    platform: "tap",
    posture: "Implement emergency phishing awareness briefing. Enable enhanced email filtering. Restrict access to sensitive systems."
  },
  {
    id: "TRT-008",
    title: "Vehicle-Borne Threat",
    location: "@ Western Approach Road",
    level: "critical" as ThreatLevel,
    icon: Truck,
    iconColor: "text-tactical-red",
    description: "Intelligence report indicates potential vehicle-borne improvised explosive device threat. Target may include diplomatic facilities.",
    time: "12:15",
    source: "Counter-Terrorism Unit",
    sourceColor: "text-tactical-red",
    platform: "tap",
    posture: "Increase vehicle inspection protocols. Deploy vehicle barriers. Alert EOD units. Notify adjacent facilities."
  },
  {
    id: "TRT-009",
    title: "Landslide Risk",
    location: "@ Eastern Hillside Access",
    level: "medium" as ThreatLevel,
    icon: Mountain,
    iconColor: "text-tactical-cyan",
    description: "Geological survey indicates increased landslide risk on eastern hillside following recent rains. Access road may be affected.",
    time: "12:00",
    source: "Geological Survey Service",
    sourceColor: "text-tactical-amber",
    platform: "gov",
    posture: "Restrict eastern access road use. Identify alternate routes. Monitor geological service updates."
  },
  {
    id: "TRT-010",
    title: "Political Instability",
    location: "@ National Level",
    level: "high" as ThreatLevel,
    icon: Flag,
    iconColor: "text-tactical-amber",
    description: "Political tensions rising following disputed election results. Opposition calls for nationwide demonstrations starting tomorrow.",
    time: "11:45",
    source: "Political Analysis Unit",
    sourceColor: "text-tactical-cyan",
    platform: "tap",
    posture: "Reduce staff movement. Brief emergency protocols. Coordinate with embassy security teams."
  },
  {
    id: "TRT-011",
    title: "Criminal Activity",
    location: "@ 300m South of Compound",
    level: "medium" as ThreatLevel,
    icon: AlertTriangle,
    iconColor: "text-tactical-cyan",
    description: "Armed robbery reported at commercial establishment 300 meters south. Suspects fled towards forested area near compound perimeter.",
    time: "11:30",
    source: "Local Security Network",
    sourceColor: "text-tactical-amber",
    platform: "whatsapp",
    posture: "Increase perimeter patrols. Alert security teams to suspect descriptions. Secure southern entrance."
  },
  {
    id: "TRT-012",
    title: "Medical Emergency",
    location: "@ Regional",
    level: "medium" as ThreatLevel,
    icon: Heart,
    iconColor: "text-tactical-cyan",
    description: "Disease outbreak reported in nearby district. Local hospitals approaching capacity. May affect staff health and availability.",
    time: "11:15",
    source: "Health Intelligence Service",
    sourceColor: "text-tactical-green",
    platform: "gov",
    posture: "Identify alternate medical facilities. Brief medical staff. Consider operational impact on staffing."
  },
  {
    id: "TRT-013",
    title: "Power Infrastructure",
    location: "@ National Grid - Regional Sector",
    level: "low" as ThreatLevel,
    icon: Zap,
    iconColor: "text-tactical-green",
    description: "Planned power maintenance affecting regional sector. Expected 8-hour blackout. Backup generator fuel levels need verification.",
    time: "11:00",
    source: "Infrastructure Monitor",
    sourceColor: "text-tactical-green",
    platform: "gov",
    posture: "Verify generator fuel levels. Test backup power systems. Coordinate scheduled blackout response."
  },
  {
    id: "TRT-014",
    title: "Insider Threat",
    location: "@ Internal",
    level: "high" as ThreatLevel,
    icon: Eye,
    iconColor: "text-tactical-amber",
    description: "Background check flagged a recently hired contractor with connections to known extremist groups. Currently has facility access.",
    time: "10:45",
    source: "Personnel Security Division",
    sourceColor: "text-tactical-red",
    platform: "tap",
    posture: "Immediately restrict facility access for flagged contractor. Initiate investigation. Audit recent access logs."
  },
  {
    id: "TRT-015",
    title: "Suspicious Surveillance",
    location: "@ North Gate Vicinity",
    level: "high" as ThreatLevel,
    icon: Eye,
    iconColor: "text-tactical-amber",
    description: "Unknown individuals observed conducting counter-surveillance activities near north gate. Using cameras and notepad. Third observation this week.",
    time: "10:30",
    source: "Guard Observation Report",
    sourceColor: "text-tactical-cyan",
    platform: "whatsapp",
    posture: "Document and photograph unknown individuals. Report to counter-intelligence. Increase north gate security posture."
  },
  {
    id: "TRT-016",
    title: "Explosive Device",
    location: "@ Mail Room",
    level: "critical" as ThreatLevel,
    icon: Package,
    iconColor: "text-tactical-red",
    description: "Suspicious package received via mail. X-ray screening shows unusual dense objects and wiring. Package origin cannot be verified.",
    time: "10:15",
    source: "Mail Screening Unit",
    sourceColor: "text-tactical-red",
    platform: "tap",
    posture: "Evacuate mail room. Notify EOD unit. Implement mail handling procedures. Brief facility staff."
  },
  {
    id: "TRT-017",
    title: "Maritime Threat",
    location: "@ Coastal Port - 15km East",
    level: "low" as ThreatLevel,
    icon: Anchor,
    iconColor: "text-tactical-green",
    description: "Unusual vessel activity reported at nearby port. Multiple unregistered boats observed. May indicate smuggling operations.",
    time: "10:00",
    source: "Maritime Intelligence",
    sourceColor: "text-tactical-cyan",
    platform: "tap",
    posture: "Monitor port activity. Notify maritime authorities. Assess coastal access security."
  },
  {
    id: "TRT-018",
    title: "Social Media Threat",
    location: "@ Online",
    level: "medium" as ThreatLevel,
    icon: Smartphone,
    iconColor: "text-tactical-cyan",
    description: "Social media posts threatening attacks on foreign installations circulating on encrypted platforms. No specific target identified.",
    time: "09:45",
    source: "Open Source Intelligence",
    sourceColor: "text-tactical-amber",
    platform: "social media",
    posture: "Monitor threat actor accounts. Report to intelligence agencies. Assess credibility and specificity."
  },
  {
    id: "TRT-019",
    title: "Environmental Hazard",
    location: "@ Industrial Zone - 2km West",
    level: "medium" as ThreatLevel,
    icon: Wind,
    iconColor: "text-tactical-cyan",
    description: "Chemical spill reported at nearby industrial plant. Wind direction may carry contaminants towards facility. Emergency services responding.",
    time: "09:30",
    source: "Environmental Monitoring",
    sourceColor: "text-tactical-green",
    platform: "gov",
    posture: "Monitor wind direction. Prepare CBRN response protocols. Assess shelter-in-place requirements."
  },
  {
    id: "TRT-020",
    title: "Armed Conflict",
    location: "@ Northern Province - 50km",
    level: "high" as ThreatLevel,
    icon: Shield,
    iconColor: "text-tactical-amber",
    description: "Armed clashes between military and insurgent groups in northern province. Displaced populations moving south towards urban areas.",
    time: "09:15",
    source: "Military Intelligence Liaison",
    sourceColor: "text-tactical-red",
    platform: "tap",
    posture: "Monitor refugee movement. Coordinate with national security agencies. Brief emergency evacuation procedures."
  },
  {
    id: "TRT-021",
    title: "VIP Movement",
    location: "@ Capital District",
    level: "low" as ThreatLevel,
    icon: Users,
    iconColor: "text-tactical-green",
    description: "High-profile diplomatic visit scheduled for tomorrow. Enhanced security measures may affect road access and local police availability.",
    time: "09:00",
    source: "Diplomatic Intelligence",
    sourceColor: "text-tactical-cyan",
    platform: "tap",
    posture: "Coordinate with diplomatic security teams. Review convoy routes. Ensure liaison with local police."
  },
  {
    id: "TRT-022",
    title: "Protest Activity",
    location: "@ Embassy Road - 500m North",
    level: "high" as ThreatLevel,
    icon: Users,
    iconColor: "text-tactical-amber",
    description: "Planned protest at nearby embassy scheduled for 15:00 today. Expected 2,000-3,000 participants. Route passes within 500m of facility.",
    time: "08:45",
    source: "Public Order Intelligence",
    sourceColor: "text-tactical-amber",
    platform: "tap",
    posture: "Monitor protest route. Brief security teams. Restrict vehicle access to affected routes after 14:00."
  },
  {
    id: "TRT-023",
    title: "Supply Chain",
    location: "@ Regional",
    level: "low" as ThreatLevel,
    icon: Truck,
    iconColor: "text-tactical-green",
    description: "Fuel supply disruptions reported due to port workers strike. May affect generator fuel and vehicle operations within 48 hours.",
    time: "08:30",
    source: "Supply Chain Monitor",
    sourceColor: "text-tactical-green",
    platform: "tap",
    posture: "Verify fuel reserve levels. Identify alternate fuel suppliers. Implement fuel rationing protocols."
  },
  {
    id: "TRT-024",
    title: "Militia Activity",
    location: "@ Rural Outskirts - 20km South",
    level: "high" as ThreatLevel,
    icon: Target,
    iconColor: "text-tactical-amber",
    description: "Armed militia group reportedly established checkpoints on southern access routes. Reports of extortion and vehicle seizures.",
    time: "08:15",
    source: "Security Forces Liaison",
    sourceColor: "text-tactical-red",
    platform: "tap",
    posture: "Avoid southern access routes. Use alternate convoy plans. Coordinate with security forces."
  },
  {
    id: "TRT-025",
    title: "Fire Risk",
    location: "@ Adjacent Commercial Zone",
    level: "medium" as ThreatLevel,
    icon: Flame,
    iconColor: "text-tactical-cyan",
    description: "Large fire reported in commercial building adjacent to compound. Wind direction favorable but may shift. Fire services responding.",
    time: "08:00",
    source: "Emergency Services Feed",
    sourceColor: "text-tactical-amber",
    platform: "gov",
    posture: "Monitor fire spread. Prepare evacuation plan. Coordinate with fire services. Check water supply systems."
  },
  {
    id: "TRT-026",
    title: "Terrorism",
    location: "@ Regional",
    level: "critical" as ThreatLevel,
    icon: AlertTriangle,
    iconColor: "text-tactical-red",
    description: "Credible intelligence indicates terror cell planning attack on critical infrastructure in region. Timeframe: next 72 hours.",
    time: "07:45",
    source: "Counter-Terrorism Intelligence",
    sourceColor: "text-tactical-red",
    platform: "tap",
    posture: "Elevate to maximum alert. Implement full security measures. Coordinate with national security agencies."
  },
  {
    id: "TRT-027",
    title: "Communications Disruption",
    location: "@ National Level",
    level: "medium" as ThreatLevel,
    icon: WifiOff,
    iconColor: "text-tactical-cyan",
    description: "Reports of mobile network disruptions in multiple areas. May indicate jamming operations or infrastructure sabotage.",
    time: "07:30",
    source: "Communications Intelligence",
    sourceColor: "text-tactical-cyan",
    platform: "tap",
    posture: "Activate backup communications. Test satellite phone systems. Brief command on contingency comms."
  },
  {
    id: "TRT-028",
    title: "Criminal Gang",
    location: "@ Eastern Suburbs - 3km",
    level: "medium" as ThreatLevel,
    icon: AlertTriangle,
    iconColor: "text-tactical-cyan",
    description: "Local gang activity escalating in eastern suburbs. Multiple carjackings reported. Staff residential area potentially affected.",
    time: "07:15",
    source: "Criminal Intelligence Unit",
    sourceColor: "text-tactical-amber",
    platform: "whatsapp",
    posture: "Issue staff advisory for affected sectors. Recommend convoy travel. Increase vehicle security measures."
  },
  {
    id: "TRT-029",
    title: "Airport Disruption",
    location: "@ International Airport",
    level: "low" as ThreatLevel,
    icon: Plane,
    iconColor: "text-tactical-green",
    description: "Airport operations disrupted due to runway maintenance. Evacuation flights may be delayed. Alternative airport 180km away.",
    time: "07:00",
    source: "Aviation Intelligence",
    sourceColor: "text-tactical-green",
    platform: "gov",
    posture: "Identify alternate evacuation airports. Update emergency evacuation plans. Notify VIP travel coordinators."
  },
  {
    id: "TRT-030",
    title: "Espionage",
    location: "@ Internal",
    level: "high" as ThreatLevel,
    icon: Eye,
    iconColor: "text-tactical-amber",
    description: "Counter-intelligence reports indicate foreign intelligence service may have recruited informant within facility. Investigation underway.",
    time: "06:45",
    source: "Counter-Intelligence Division",
    sourceColor: "text-tactical-red",
    platform: "tap",
    posture: "Restrict access to classified areas. Brief counter-intelligence team. Implement enhanced access controls."
  },
  {
    id: "TRT-031",
    title: "Protest Movement",
    location: "@ F-6 Markaz, Islamabad",
    level: "high" as ThreatLevel,
    icon: Users,
    iconColor: "text-tactical-amber",
    description: "TAP alert: Large gathering planned at F-6 Markaz tomorrow 14:00. Expected 3,000+ participants. Route passes near multiple client sites.",
    time: "06:30",
    source: "TAP",
    sourceColor: "text-tactical-green",
    platform: "tap",
    posture: "Monitor F-6 Markaz situation. Restrict movement near planned route. Coordinate with TAP for updates."
  },
  {
    id: "TRT-032",
    title: "IED Threat",
    location: "@ Srinagar Highway, Islamabad",
    level: "critical" as ThreatLevel,
    icon: Package,
    iconColor: "text-tactical-red",
    description: "Champ Alert: Suspicious device reported near Srinagar Highway interchange. Area being cordoned by police. Avoid route for VIP movement.",
    time: "06:15",
    source: "Champ Alert on the Go",
    sourceColor: "text-tactical-red",
    platform: "champ",
    posture: "Avoid Srinagar Highway interchange. Reroute all VIP movements. Alert EOD units. Notify relevant authorities."
  },
  {
    id: "TRT-033",
    title: "Criminal Activity",
    location: "@ G-9 to G-11 Sector, Islamabad",
    level: "medium" as ThreatLevel,
    icon: CarFront,
    iconColor: "text-tactical-cyan",
    description: "WhatsApp Security Group report: Multiple car-jacking incidents in G-9/G-11 sectors last 24 hours. Armed suspects operating in white Toyota Corolla.",
    time: "06:00",
    source: "WhatsApp Group",
    sourceColor: "text-tactical-cyan",
    platform: "whatsapp",
    posture: "Issue staff advisory for G-9/G-11 sectors. Recommend alternate routes. Increase vehicle security awareness."
  },
  {
    id: "TRT-034",
    title: "Earthquake Alert",
    location: "@ Islamabad / Rawalpindi Region",
    level: "medium" as ThreatLevel,
    icon: Activity,
    iconColor: "text-tactical-cyan",
    description: "Government Notification: Seismic activity detected near Margalla Hills. 4.2 magnitude tremor recorded. Aftershocks possible in next 12 hours.",
    time: "05:45",
    source: "Government Notification",
    sourceColor: "text-tactical-amber",
    platform: "gov",
    posture: "Assess structural integrity of facility. Review emergency response procedures. Monitor aftershock alerts."
  },
  {
    id: "TRT-035",
    title: "Suspicious Activity",
    location: "@ Diplomatic Enclave, Islamabad",
    level: "high" as ThreatLevel,
    icon: Eye,
    iconColor: "text-tactical-amber",
    description: "Social media OSINT: Posts on X/Twitter showing photos of diplomatic enclave security arrangements. User appears to be conducting hostile reconnaissance.",
    time: "05:30",
    source: "Social Media",
    sourceColor: "text-tactical-amber",
    platform: "social media",
    posture: "Report OSINT findings to counter-intelligence. Increase physical security in diplomatic enclave. Alert relevant embassies."
  },
  {
    id: "TRT-036",
    title: "VIP Threat",
    location: "@ Serena Hotel to French Embassy Route",
    level: "critical" as ThreatLevel,
    icon: Shield,
    iconColor: "text-tactical-red",
    description: "TAP advisory: Credible threat to VIP convoy movement on planned route. Intelligence suggests possible ambush point near Kohala Bridge.",
    time: "05:15",
    source: "TAP",
    sourceColor: "text-tactical-green",
    platform: "tap",
    posture: "Cancel or reroute planned convoy. Alert VIP protection teams. Coordinate with TAP for alternative routing."
  }
];

const levelConfig: Record<string, { bg: string, text: string }> = {
  critical: { bg: "bg-tactical-red/20", text: "text-tactical-red" },
  high: { bg: "bg-tactical-amber/20", text: "text-tactical-amber" },
  medium: { bg: "bg-tactical-cyan/20", text: "text-tactical-cyan" },
  low: { bg: "bg-tactical-green/20", text: "text-tactical-green" }
};

export default function ThreatIntelPage() {
  const [mounted, setMounted] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => setMounted(true), []);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sourceFilteredThreats = threats.filter(t =>
    sourceFilter === "all" || t.platform === sourceFilter
  );

  const filteredThreats = sourceFilteredThreats.filter(t =>
    levelFilter === "all" || t.level === levelFilter
  );

  const levelCount = (level: string) =>
    sourceFilteredThreats.filter(t => t.level === level).length;

  const getPillStyle = (active: boolean) =>
    active
      ? "inline-flex items-center gap-1.5 px-5 py-1.5 rounded-full border border-tactical-cyan bg-tactical-cyan/10 text-tactical-cyan font-mono text-[11px] font-medium transition-colors cursor-pointer"
      : "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-border/50 bg-secondary/30 hover:bg-secondary/60 text-muted-foreground font-mono text-[11px] font-medium transition-colors cursor-pointer";

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header section */}
      <div className={`space-y-1 ${mounted ? "fade-in-up" : "opacity-0"}`}>
        <h1 className="text-2xl font-bold tracking-tight text-white font-mono">Threat Intelligence Feed</h1>
        <p className="text-sm text-muted-foreground font-mono">
          External risk signals, intelligence analysis, and security posture recommendations — TAP, Champ, WhatsApp, OSINT
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className={`glow-border rounded-xl p-5 bg-card noise-texture border border-border/50 flex items-center gap-4 ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: "100ms" }}>
          <div className="h-10 w-10 rounded-lg bg-tactical-red/10 flex items-center justify-center border border-tactical-red/20">
            <AlertTriangle className="h-5 w-5 text-tactical-red" />
          </div>
          <div>
            <p className="text-3xl font-bold font-mono text-white">{threats.filter(t => t.level === "critical").length}</p>
            <p className="text-[10px] tracking-widest text-muted-foreground uppercase font-mono">Critical Threats</p>
          </div>
        </div>

        <div className={`glow-border rounded-xl p-5 bg-card noise-texture border border-border/50 flex items-center gap-4 ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: "150ms" }}>
          <div className="h-10 w-10 rounded-lg bg-tactical-amber/10 flex items-center justify-center border border-tactical-amber/20">
            <ShieldCheck className="h-5 w-5 text-tactical-amber" />
          </div>
          <div>
            <p className="text-3xl font-bold font-mono text-white">{threats.filter(t => t.level === "high").length}</p>
            <p className="text-[10px] tracking-widest text-muted-foreground uppercase font-mono">High Threats</p>
          </div>
        </div>

        <div className={`glow-border rounded-xl p-5 bg-card noise-texture border border-border/50 flex items-center gap-4 ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: "200ms" }}>
          <div className="h-10 w-10 rounded-lg bg-tactical-cyan/10 flex items-center justify-center border border-tactical-cyan/20">
            <MapPin className="h-5 w-5 text-tactical-cyan" />
          </div>
          <div>
            <p className="text-3xl font-bold font-mono text-white">{threats.length}</p>
            <p className="text-[10px] tracking-widest text-muted-foreground uppercase font-mono">Total Alerts</p>
          </div>
        </div>

        <div className={`glow-border rounded-xl p-5 bg-card noise-texture border border-border/50 flex items-center gap-4 ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: "250ms" }}>
          <div className="h-10 w-10 rounded-lg bg-[#A78BFA]/10 flex items-center justify-center border border-[#A78BFA]/20">
            <Activity className="h-5 w-5 text-[#A78BFA]" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono text-[#A78BFA]">BRAVO</p>
            <p className="text-[10px] tracking-widest text-muted-foreground uppercase font-mono">Security Posture</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`space-y-4 ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: "300ms" }}>
        <div className="space-y-3">
          <p className="text-[10px] font-mono tracking-widest text-muted-foreground font-semibold">INTELLIGENCE SOURCE</p>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSourceFilter("all")} className={getPillStyle(sourceFilter === "all")}>
              All
            </button>
            <button onClick={() => setSourceFilter("tap")} className={getPillStyle(sourceFilter === "tap")}>
              <Radio className="h-3 w-3 text-tactical-green" /> TAP ({threats.filter(t => t.platform === "tap").length})
            </button>
            <button onClick={() => setSourceFilter("champ")} className={getPillStyle(sourceFilter === "champ")}>
              <AlertTriangle className="h-3 w-3 text-white" /> Champ Alert ({threats.filter(t => t.platform === "champ").length})
            </button>
            <button onClick={() => setSourceFilter("whatsapp")} className={getPillStyle(sourceFilter === "whatsapp")}>
              <MessageCircle className="h-3 w-3 text-white" /> WhatsApp Group ({threats.filter(t => t.platform === "whatsapp").length})
            </button>
            <button onClick={() => setSourceFilter("social media")} className={getPillStyle(sourceFilter === "social media")}>
              <Smartphone className="h-3 w-3 text-tactical-cyan" /> Social Media ({threats.filter(t => t.platform === "social media").length})
            </button>
            <button onClick={() => setSourceFilter("gov")} className={getPillStyle(sourceFilter === "gov")}>
              <Landmark className="h-3 w-3 text-white" /> Government Notification ({threats.filter(t => t.platform === "gov").length})
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={() => setLevelFilter("all")} className={getPillStyle(levelFilter === "all")}>
              All ({sourceFilteredThreats.length})
            </button>
            <button onClick={() => setLevelFilter("critical")} className={getPillStyle(levelFilter === "critical")}>
              Critical ({levelCount("critical")})
            </button>
            <button onClick={() => setLevelFilter("high")} className={getPillStyle(levelFilter === "high")}>
              High ({levelCount("high")})
            </button>
            <button onClick={() => setLevelFilter("medium")} className={getPillStyle(levelFilter === "medium")}>
              Medium ({levelCount("medium")})
            </button>
            <button onClick={() => setLevelFilter("low")} className={getPillStyle(levelFilter === "low")}>
              Low ({levelCount("low")})
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground font-mono pt-2">Showing {filteredThreats.length} of {threats.length} threats</p>
      </div>

      {/* Grid of Threats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
        {filteredThreats.map((threat, idx) => {
          const isExpanded = expandedIds.has(threat.id);
          return (
          <div
            key={threat.id}
            className={`flex flex-col rounded-xl bg-card border border-border/40 overflow-hidden hover:border-border transition-colors ${mounted ? "fade-in-up" : "opacity-0"}`}
            style={{ animationDelay: `${350 + (idx * 50)}ms` }}
          >
            <div className="p-5 flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <threat.icon className={`h-4 w-4 ${threat.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white font-mono text-sm">{threat.title}</h3>
                    <p className="text-[10px] text-muted-foreground font-mono">{threat.location}</p>
                  </div>
                </div>
                <div
                  onClick={() => toggleExpand(threat.id)}
                  className="flex items-center gap-1 hover:bg-white/5 px-1 rounded cursor-pointer transition-colors"
                >
                  <span className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${levelConfig[threat.level].bg} ${levelConfig[threat.level].text}`}>
                    {threat.level}
                  </span>
                  {isExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                </div>
              </div>

              <p className="text-[11px] leading-relaxed text-muted-foreground/90 font-mono">
                {threat.description}
              </p>

              {isExpanded && (
                <div className="mt-4 p-3 rounded-lg border border-tactical-cyan/30 bg-tactical-cyan/5">
                  <span className="font-mono text-[9px] text-tactical-cyan uppercase tracking-widest font-bold block mb-1">
                    Suggested Security Posture
                  </span>
                  <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
                    {threat.posture}
                  </p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border/40 bg-black/20 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-muted-foreground/60">
                <Clock className="h-3 w-3" />
                <span className="font-mono text-[10px]">{threat.time}</span>
              </div>
              <span className={`font-mono text-[10px] font-medium ${threat.sourceColor}`}>
                {threat.source}
              </span>
            </div>
          </div>
        )})}
      </div>

    </div>
  );
}
