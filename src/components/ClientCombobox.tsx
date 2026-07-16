"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ClientOption = {
  id: string;
  clientCode: string | null;
  name: string;
  email: string;
  phone: string | null;
};

function displayLabel(client: ClientOption) {
  return `${client.name} — ${client.clientCode ?? client.email}`;
}

export function ClientCombobox({
  id,
  clients,
  value,
  onChange,
  placeholder = "Search by client ID, name, email, or phone",
}: {
  id?: string;
  clients: ClientOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = clients.find((c) => c.id === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        render={
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          />
        }
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected ? displayLabel(selected) : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-(--anchor-width) p-0" align="start">
        <Command
          filter={(itemValue, search) =>
            itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }
        >
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>No matching clients</CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={[client.clientCode, client.name, client.email, client.phone]
                    .filter(Boolean)
                    .join(" ")}
                  onSelect={() => {
                    onChange(client.id);
                    setOpen(false);
                  }}
                >
                  <Check className={client.id === value ? "opacity-100" : "opacity-0"} />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{client.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {client.clientCode ?? "—"} · {client.email}
                      {client.phone ? ` · ${client.phone}` : ""}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
