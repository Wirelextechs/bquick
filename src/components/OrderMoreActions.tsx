"use client";

import { useState } from "react";
import { MoreHorizontal, UserCog, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReassignClientButton } from "./ReassignClientButton";
import { AdminStatusOverride } from "./AdminStatusOverride";

// Admin-only secondary actions on the order detail header, tucked into a
// dropdown so the hero banner doesn't have to cram 4 buttons onto mobile.
export function OrderMoreActions({
  orderId,
  currentClientName,
  currentStatus,
}: {
  orderId: string;
  currentClientName: string;
  currentStatus: string;
}) {
  const [reassignOpen, setReassignOpen] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" aria-label="More actions" />}>
          <MoreHorizontal className="size-3.5" /> More
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setReassignOpen(true)}>
            <UserCog className="size-3.5" /> Reassign client
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOverrideOpen(true)}>
            <ShieldAlert className="size-3.5" /> Correct status
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReassignClientButton
        orderId={orderId}
        currentClientName={currentClientName}
        trigger={null}
        open={reassignOpen}
        onOpenChange={setReassignOpen}
      />
      <AdminStatusOverride
        orderId={orderId}
        currentStatus={currentStatus}
        trigger={null}
        open={overrideOpen}
        onOpenChange={setOverrideOpen}
      />
    </>
  );
}
