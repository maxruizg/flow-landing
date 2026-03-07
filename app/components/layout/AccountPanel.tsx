import { SlidePanel } from "./SlidePanel";
import { Button } from "~/components/ui/Button";

interface AccountPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountPanel({ isOpen, onClose }: AccountPanelProps) {
  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title="Account">
      <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-[10px] uppercase tracking-[0.2em] text-flow-500 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="w-full bg-flow-900 border border-flow-700 rounded-none px-4 py-3 text-sm text-white placeholder:text-flow-500 focus:outline-none focus:border-flow-400 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-[10px] uppercase tracking-[0.2em] text-flow-500 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            className="w-full bg-flow-900 border border-flow-700 rounded-none px-4 py-3 text-sm text-white placeholder:text-flow-500 focus:outline-none focus:border-flow-400 transition-colors"
          />
        </div>

        <Button type="submit" className="w-full">
          Sign In
        </Button>

        <div className="flex items-center justify-between pt-2">
          <button type="button" className="text-xs text-flow-400 hover:text-white transition-colors underline underline-offset-4">
            Create Account
          </button>
          <button type="button" className="text-xs text-flow-400 hover:text-white transition-colors underline underline-offset-4">
            Forgot Password?
          </button>
        </div>
      </form>
    </SlidePanel>
  );
}
