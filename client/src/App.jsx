import { Route, Switch } from "wouter";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import LeadDetail from "./pages/LeadDetail";
import ChatPanel from "./components/ChatPanel";
import "./index.css";

export default function App() {
  return (
    <div className="min-h-screen">
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/leads/:id" component={LeadDetail} />
      </Switch>
      <ChatPanel />
    </div>
  );
}
