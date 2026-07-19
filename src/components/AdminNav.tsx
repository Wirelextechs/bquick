import { Package, Users, Truck, ArrowLeftRight } from "lucide-react";

// AppShell derives which item is active from the current URL, so this is
// just the static list — no per-page "active" argument needed anymore.
export function AdminNav() {
  return [
    { href: "/admin", label: "Shipments", icon: <Package className="h-5 w-5" /> },
    { href: "/admin/clients", label: "Clients", icon: <Users className="h-5 w-5" /> },
    { href: "/admin/agents", label: "Agents", icon: <Truck className="h-5 w-5" /> },
    { href: "/admin/exchange", label: "RMB Exchange", icon: <ArrowLeftRight className="h-5 w-5" /> },
  ];
}
