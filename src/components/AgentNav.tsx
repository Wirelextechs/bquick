import { Package, User } from "lucide-react";

export function AgentNav(active: "shipments" | "profile") {
  return [
    {
      href: "/agent",
      label: "Shipments",
      icon: <Package className="h-5 w-5" />,
      active: active === "shipments",
    },
    {
      href: "/agent/profile",
      label: "My Profile",
      icon: <User className="h-5 w-5" />,
      active: active === "profile",
    },
  ];
}
