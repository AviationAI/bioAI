import { Link } from "react-router-dom";
import {
  UserButton,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
} from "@clerk/clerk-react";

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0f1c]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* LEFT */}
        <div className="flex items-center gap-10">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 no-underline">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 font-bold text-black">
              B
            </div>
            <div className="leading-tight">
              <p className="m-0 text-sm font-semibold text-white">Modern Bio</p>
              <p className="m-0 text-[11px] text-gray-400">AI Research Platform</p>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden items-center gap-1 md:flex">
            <Link
              to="/"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 no-underline transition hover:bg-white/5 hover:text-white"
            >
              Home
            </Link>
            <SignedIn>
              <Link
                to="/create"
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 no-underline transition hover:bg-white/5 hover:text-white"
              >
                Create
              </Link>
            </SignedIn>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/10 hover:text-white">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]">
                Get Started
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <div className="rounded-full ring-2 ring-white/10">
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;