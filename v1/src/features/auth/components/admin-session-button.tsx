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
              "h-10 rounded-full border-white/18 bg-white/8 px-4 text-sm text-white hover:bg-white/12 hover:text-white",
          }),
          className
        )}
      >
        Sign out
      </button>
    </form>
  );
}
