import { Package, Users, Truck, ArrowLeftRight } from "lucide-react";

export function AdminNav(active: "orders" | "clients" | "agents" | "exchange") {
  return [
    {
      href: "/admin",
      label: "Shipments",
      icon: <Package className="h-5 w-5" />,
      active: active === "orders",
    },
    {
      href: "/admin/clients",
      label: "Clients",
      icon: <Users className="h-5 w-5" />,
      active: active === "clients",
    },
    {
      href: "/admin/agents",
      label: "Agents",
      icon: <Truck className="h-5 w-5" />,
      active: active === "agents",
    },
    {
      href: "/admin/exchange",
      label: "RMB Exchange",
      icon: <ArrowLeftRight className="h-5 w-5" />,
      active: active === "exchange",
    },
  ];
}
