"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { copy } from "@/content/copy";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[halden] page error");
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-4 px-4 py-16">
      <h1 className="font-display text-4xl tracking-tight">{copy.routeError.title}</h1>
      <p className="text-muted-foreground">{copy.routeError.body}</p>
      <Button type="button" className="h-11 w-fit px-4 text-base" onClick={() => reset()}>
        {copy.routeError.retry}
      </Button>
    </main>
  );
}
