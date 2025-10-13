"use client";

import { useCallback } from "react";
import { ChatKitPanel, type FactAction } from "@/components/ChatKitPanel";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function App({
  workflowId,
  variant = "default",
}: {
  workflowId?: string;
  variant?: "default" | "embed";
}) {
  const { scheme, setScheme } = useColorScheme();

  const handleWidgetAction = useCallback(async (action: FactAction) => {
    if (process.env.NODE_ENV !== "production") {
      console.info("[ChatKitPanel] widget action", action);
    }
  }, []);

  const handleResponseEnd = useCallback(() => {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[ChatKitPanel] response end");
    }
  }, []);

  const isEmbed = variant === "embed";

  return (
    <main
      className={
        isEmbed
          ? "flex h-screen w-full flex-col overflow-hidden"
          : "flex min-h-screen flex-col items-center justify-center bg-slate-100 px-6 py-6 dark:bg-slate-950"
      }
    >
      <div className={isEmbed ? "flex h-full w-full flex-col" : "mx-auto w-full max-w-5xl"}>
        <ChatKitPanel
          workflowId={workflowId}
          variant={variant}
          theme={scheme}
          onWidgetAction={handleWidgetAction}
          onResponseEnd={handleResponseEnd}
          onThemeRequest={setScheme}
        />
      </div>
    </main>
  );
}
