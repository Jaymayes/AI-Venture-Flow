import { Route, Switch, Redirect } from "wouter";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import LeadDetail from "./pages/LeadDetail";
import CEODashboard from "./pages/CEODashboard";
import Recruit from "./pages/Recruit";
import Outreach from "./pages/Outreach";
import BQM from "./pages/BQM";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import CookiePolicy from "./pages/CookiePolicy";
import Disclaimer from "./pages/Disclaimer";
import Accessibility from "./pages/Accessibility";
import AcceptableUse from "./pages/AcceptableUse";
import Playbook from "./pages/Playbook";
import Onboarding from "./pages/Onboarding";
import TeamDelegation from "./pages/TeamDelegation";
import Disbursements from "./pages/Disbursements";
import TriageLaunchpad from "./pages/TriageLaunchpad";
import EngagementDetail from "./pages/EngagementDetail";
import CampaignStudio from "./pages/CampaignStudio";
import SPLaunchpad from "./pages/SPLaunchpad";
import AuthGate from "./components/AuthGate";
import SPGate from "./components/SPGate";
import Portal from "./pages/Portal";
import SPCommandCenter from "./pages/SPCommandCenter";
import DealRoom from "./pages/DealRoom";
import DealView from "./pages/DealView";
import KickoffPortal from "./pages/KickoffPortal";
import ClientPortal from "./pages/ClientPortal";
import MagicVerify from "./pages/MagicVerify";
import CardView from "./pages/CardView";
import CrmGateway from "./pages/CrmGateway";
import SPPortal from "./pages/SPPortal";
import SEOApproval from "./pages/SEOApproval";
import ChatPanel from "./components/ChatPanel";
import LegalFooter from "./components/LegalFooter";
import "./index.css";

// ---------------------------------------------------------------------------
// Protected Route wrappers
// ---------------------------------------------------------------------------
function ProtectedRoute({ component: Component }) {
  return (
    <AuthGate>
      <Component />
    </AuthGate>
  );
}

function SPProtectedRoute({ component: Component }) {
  return (
    <SPGate>
      <Component />
    </SPGate>
  );
}

export default function App() {
  // Detect DBC card routes — they have their own chat widget + no global chrome
  const [, params] = window.location.pathname.match(/^\/c\/([^/]+)/) || [];
  const isCardRoute = !!params;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/leads/:id" component={LeadDetail} />
          <Route path="/ceo">
            <ProtectedRoute component={CEODashboard} />
          </Route>
          <Route path="/playbook">
            <SPProtectedRoute component={Playbook} />
          </Route>
          <Route path="/onboarding">
            <SPProtectedRoute component={Onboarding} />
          </Route>
          <Route path="/delegation">
            <SPProtectedRoute component={TeamDelegation} />
          </Route>
          <Route path="/disbursements">
            <ProtectedRoute component={Disbursements} />
          </Route>
          <Route path="/triage/:id">
            <ProtectedRoute component={EngagementDetail} />
          </Route>
          <Route path="/triage">
            <ProtectedRoute component={TriageLaunchpad} />
          </Route>
          <Route path="/campaign">
            <ProtectedRoute component={CampaignStudio} />
          </Route>
          <Route path="/portal">
            <ProtectedRoute component={Portal} />
          </Route>
          {/* ── Epic 37: SEO Approval — CEO HITL gate for AI-generated content ── */}
          <Route path="/seo-approval">
            <ProtectedRoute component={SEOApproval} />
          </Route>
          {/* ── Epic 32: SP Portal — Sovereign Professional Command Dashboard ── */}
          <Route path="/sp" component={SPPortal} />
          {/* ── Phase 3: CRM Gateway — role-aware routing (CEO → monitoring, SP → operations) ── */}
          <Route path="/crm" component={CrmGateway} />
          {/* ── Phase 71: SP Command Center — consolidated dashboard ── */}
          <Route path="/partner/:slug/dashboard"><Redirect to="/partner" /></Route>
          <Route path="/partner/:slug"><Redirect to="/partner" /></Route>
          <Route path="/partner" component={SPCommandCenter} />
          {/* ── Phase 45: Deal Room Auto-Generator — public SOW page ── */}
          <Route path="/deal/:id" component={DealView} />
          {/* ── Phase 49: Kickoff Engine — post-purchase intake portal ── */}
          <Route path="/kickoff/:id" component={KickoffPortal} />
          {/* ── Passwordless magic-link verify (Pillar 1) — MUST precede /portal/:id
                so the emailed /portal/magic?token= link isn't shadowed by ClientPortal ── */}
          <Route path="/portal/magic" component={MagicVerify} />
          {/* ── Phase 51: Client Portal — public project dashboard ── */}
          <Route path="/portal/:id" component={ClientPortal} />
          {/* ── Phase 24: Deal Room — public magic-link access (no auth) ── */}
          <Route path="/deal-room/:token" component={DealRoom} />
          {/* ── Phase 37: Digital Business Card — public AI-powered profile ── */}
          <Route path="/c/:slug" component={CardView} />
          {/* ── SP Launchpad Dashboard (self-managed auth via AuthProvider) ── */}
          <Route path="/launchpad" component={SPLaunchpad} />
          <Route path="/recruit" component={Recruit} />
          <Route path="/outreach" component={Outreach} />
          <Route path="/bqm" component={BQM} />
          {/* ── Legal & Compliance Pages ── */}
          <Route path="/privacy" component={PrivacyPolicy} />
          <Route path="/terms" component={TermsOfUse} />
          <Route path="/cookies" component={CookiePolicy} />
          <Route path="/disclaimer" component={Disclaimer} />
          <Route path="/accessibility" component={Accessibility} />
          <Route path="/aup" component={AcceptableUse} />
        </Switch>
      </div>
      {!isCardRoute && <LegalFooter />}
      {!isCardRoute && <ChatPanel />}
    </div>
  );
}
