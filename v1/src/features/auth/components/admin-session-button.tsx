import { buttonVariants } from "@/components/ui/button-variants";
import { signOutAction } from "@/features/auth/actions/auth-actions";
import { cn } from "@/lib/utils";

export function AdminSessionButton({ className }: { className?: string }) {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className={cn(
          buttonVariants({
            variant: "outline",
            className:
              "h-10 rounded-full border-border/80 bg-white/70 px-4 text-sm text-foreground hover:bg-white hover:text-foreground",
          }),
          className
        )}
      >
        Sign out
      </button>
    </form>
  );
}
