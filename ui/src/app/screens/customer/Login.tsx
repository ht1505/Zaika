import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Logo } from "../../components/zaika/Logo";
import { ZaikaButton } from "../../components/zaika/ZaikaButton";
import { ZaikaInput } from "../../components/zaika/ZaikaInput";
import { ZaikaCard } from "../../components/zaika/ZaikaCard";
import { Info } from "lucide-react";

export default function CustomerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/customer");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-turmeric/20 to-cream flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="lg" />
          <p className="text-muted-foreground mt-2">Welcome back to Zaika</p>
        </div>

        <ZaikaCard>
          <form onSubmit={handleLogin} className="space-y-6">
            <ZaikaInput
              label="Email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <ZaikaInput
              label="Password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span>Remember me</span>
              </label>
              <a href="#" className="text-saffron hover:text-saffron-dark">
                Forgot password?
              </a>
            </div>

            <ZaikaButton type="submit" variant="primary" className="w-full">
              Sign In
            </ZaikaButton>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <a href="#" className="text-saffron hover:text-saffron-dark font-medium">
                Sign up
              </a>
            </div>
          </form>
        </ZaikaCard>

        {/* Demo Credentials */}
        <ZaikaCard className="mt-4 bg-turmeric/10">
          <div className="flex gap-3">
            <Info className="text-saffron flex-shrink-0" size={20} />
            <div>
              <p className="font-medium text-sm mb-2">Demo Credentials</p>
              <p className="text-sm text-muted-foreground">
                Email: <span className="font-mono">demo@zaika.com</span>
                <br />
                Password: <span className="font-mono">demo123</span>
              </p>
            </div>
          </div>
        </ZaikaCard>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-saffron hover:text-saffron-dark">
            ← Back to Design System
          </Link>
        </div>
      </div>
    </div>
  );
}
