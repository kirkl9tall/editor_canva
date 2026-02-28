"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import InfinityLogo from "@/components/InfinityLogo"
import Link from "next/link"

type Tab = "signin" | "register"

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
)

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard"

  const [tab, setTab] = useState<Tab>("signin")

  // sign-in state
  const [siEmail, setSiEmail]       = useState("")
  const [siPassword, setSiPassword] = useState("")
  const [siError, setSiError]       = useState("")
  const [siLoading, setSiLoading]   = useState(false)

  // register state
  const [rName, setRName]           = useState("")
  const [rEmail, setREmail]         = useState("")
  const [rPassword, setRPassword]   = useState("")
  const [rConfirm, setRConfirm]     = useState("")
  const [rError, setRError]         = useState("")
  const [rSuccess, setRSuccess]     = useState(false)
  const [rLoading, setRLoading]     = useState(false)

  const handleGoogle = () => signIn("google", { callbackUrl })

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setSiError("")
    setSiLoading(true)
    const res = await signIn("credentials", {
      email: siEmail,
      password: siPassword,
      callbackUrl,
      redirect: false,
    })
    setSiLoading(false)
    if (res?.error) {
      setSiError("Invalid email or password.")
    } else {
      router.push(callbackUrl)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRError("")
    if (rPassword !== rConfirm) {
      setRError("Passwords do not match.")
      return
    }
    setRLoading(true)
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: rName, email: rEmail, password: rPassword }),
    })
    const data = await res.json()
    setRLoading(false)
    if (!res.ok) {
      setRError(data.error ?? "Registration failed.")
      return
    }
    const loginRes = await signIn("credentials", {
      email: rEmail,
      password: rPassword,
      callbackUrl,
      redirect: false,
    })
    if (loginRes?.error) {
      setRSuccess(true)
    } else {
      router.push(callbackUrl)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md">

        <div className="flex flex-col items-center gap-2 mb-8">
          <InfinityLogo size={44} />
          <span className="text-2xl font-bold tracking-tight">Renderify</span>
          <p className="text-sm text-muted-foreground">
            {tab === "signin" ? "Sign in to your account" : "Create your free account"}
          </p>
        </div>

        <div className="bg-background border rounded-2xl shadow-sm p-8 space-y-6">

          {/* Tabs */}
          <div className="flex rounded-lg bg-muted p-1 gap-1">
            {(["signin", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setSiError(""); setRError("") }}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
                  tab === t
                    ? "bg-background shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {/* Google */}
          <Button variant="outline" className="w-full gap-2" onClick={handleGoogle}>
            <GoogleIcon />
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Sign In Form */}
          {tab === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="si-email">Email</Label>
                <Input id="si-email" type="email" placeholder="you@example.com"
                  value={siEmail} onChange={(e) => setSiEmail(e.target.value)}
                  required autoComplete="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="si-password">Password</Label>
                <Input id="si-password" type="password" placeholder="••••••••"
                  value={siPassword} onChange={(e) => setSiPassword(e.target.value)}
                  required autoComplete="current-password" />
              </div>
              {siError && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{siError}</p>
              )}
              <Button className="w-full" type="submit" disabled={siLoading}>
                {siLoading ? "Signing in…" : "Sign in"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                No account yet?{" "}
                <button type="button" onClick={() => setTab("register")}
                  className="text-primary hover:underline font-medium">
                  Create one for free
                </button>
              </p>
            </form>
          )}

          {/* Register Form */}
          {tab === "register" && (
            <>
              {rSuccess ? (
                <div className="text-center space-y-3">
                  <div className="text-4xl">🎉</div>
                  <p className="font-semibold">Account created!</p>
                  <p className="text-sm text-muted-foreground">You can now sign in with your email and password.</p>
                  <Button className="w-full" onClick={() => setTab("signin")}>Go to sign in</Button>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="r-name">Full name</Label>
                    <Input id="r-name" type="text" placeholder="Jane Smith"
                      value={rName} onChange={(e) => setRName(e.target.value)}
                      required autoComplete="name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="r-email">Email</Label>
                    <Input id="r-email" type="email" placeholder="you@example.com"
                      value={rEmail} onChange={(e) => setREmail(e.target.value)}
                      required autoComplete="email" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="r-password">Password</Label>
                    <Input id="r-password" type="password" placeholder="At least 8 characters"
                      value={rPassword} onChange={(e) => setRPassword(e.target.value)}
                      required autoComplete="new-password" minLength={8} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="r-confirm">Confirm password</Label>
                    <Input id="r-confirm" type="password" placeholder="Repeat password"
                      value={rConfirm} onChange={(e) => setRConfirm(e.target.value)}
                      required autoComplete="new-password" />
                  </div>
                  {rError && (
                    <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{rError}</p>
                  )}
                  <Button className="w-full" type="submit" disabled={rLoading}>
                    {rLoading ? "Creating account…" : "Create account"}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <button type="button" onClick={() => setTab("signin")}
                      className="text-primary hover:underline font-medium">
                      Sign in
                    </button>
                  </p>
                </form>
              )}
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing you agree to our{" "}
          <Link href="/terms" className="hover:underline">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
