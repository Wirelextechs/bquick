import { Package, User, ArrowLeftRight } from "lucide-react";

export function ClientNav() {
  return [
    { href: "/client", label: "My Shipments", icon: <Package className="h-5 w-5" /> },
    { href: "/client/exchange", label: "RMB Exchange", icon: <ArrowLeftRight className="h-5 w-5" /> },
    { href: "/client/profile", label: "My Profile", icon: <User className="h-5 w-5" /> },
  ];
}
