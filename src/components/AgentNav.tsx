import { Package, User } from "lucide-react";

export function AgentNav() {
  return [
    { href: "/agent", label: "Shipments", icon: <Package className="h-5 w-5" /> },
    { href: "/agent/profile", label: "My Profile", icon: <User className="h-5 w-5" /> },
  ];
}
