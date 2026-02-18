import { Route, Switch } from "wouter";
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
import Disbursements from "./pages/Disbursements";
import AuthGate from "./components/AuthGate";
import SPGate from "./components/SPGate";
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
          <Route path="/disbursements">
            <ProtectedRoute component={Disbursements} />
          </Route>
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
      <LegalFooter />
      <ChatPanel />
    </div>
  );
}
