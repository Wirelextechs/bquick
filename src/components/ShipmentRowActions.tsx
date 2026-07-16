"use client";

import { useState } from "react";
import { MoreHorizontal, UserCog, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReassignClientButton } from "./ReassignClientButton";
import { OrderHistoryButton } from "./OrderHistoryButton";

export function ShipmentRowActions({
  orderId,
  currentClientName,
}: {
  orderId: string;
  currentClientName: string;
}) {
  const [reassignOpen, setReassignOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More actions" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setReassignOpen(true)}>
            <UserCog className="size-3.5" /> Reassign client
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setHistoryOpen(true)}>
            <History className="size-3.5" /> View history
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
      <OrderHistoryButton orderId={orderId} trigger={null} open={historyOpen} onOpenChange={setHistoryOpen} />
    </>
  );
}
