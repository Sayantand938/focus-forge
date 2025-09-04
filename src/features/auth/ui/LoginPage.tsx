// src/features/auth/ui/LoginPage.tsx
import { useState } from "react";
import { Mountain, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../auth.store";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

export function LoginPage() {
  const { login, signUp } = useAuthStore((state) => state.actions);
  const [isLoginView, setIsLoginView] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLoginView) {
        await login(email, password);
      } else {
        await signUp(name, email, password);
      }
    } catch {
      setIsLoading(false);
    }
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setName("");
    setEmail("");
    setPassword("");
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-sm shadow-xl rounded-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Header */}
          <CardHeader className="text-center space-y-3">
            <div className="flex justify-center items-center gap-2">
              <Mountain className="h-8 w-8" aria-hidden="true" />
              <h1 className="text-2xl font-bold">Focus Forge</h1>
            </div>
            <CardTitle className="text-lg font-semibold">
              {isLoginView ? "Welcome Back 👋" : "Create an Account"}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {isLoginView
                ? "Enter your credentials to sign in."
                : "Fill in the details below to get started."}
            </CardDescription>
          </CardHeader>

          {/* Form Inputs */}
          <CardContent className="flex flex-col gap-4">
            {!isLoginView && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus={!isLoginView}
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus={isLoginView}
              />
            </div>
            <div className="flex flex-col gap-2 relative">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </CardContent>

          {/* Actions */}
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? "Processing..."
                : isLoginView
                ? "Sign In"
                : "Sign Up"}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              {isLoginView ? (
                <>
                  Don’t have an account?{" "}
                  <button
                    type="button"
                    onClick={toggleView}
                    className="text-primary hover:underline"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={toggleView}
                    className="text-primary hover:underline"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
