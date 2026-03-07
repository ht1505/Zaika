import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { ZaikaButton } from "../../components/zaika/ZaikaButton";
import { ZaikaInput } from "../../components/zaika/ZaikaInput";
import { ZaikaCard } from "../../components/zaika/ZaikaCard";
import { Shield, Info } from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-forest flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <Shield className="text-saffron" size={40} />
            <div className="text-left">
              <h2 className="text-white mb-0">Zaika Admin</h2>
              <p className="text-white/70 text-sm">Secure Portal Access</p>
            </div>
          </div>
        </div>

        <ZaikaCard>
          <form onSubmit={handleLogin} className="space-y-6">
            <ZaikaInput
              label="Admin Email"
              type="email"
              placeholder="admin@zaika.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <ZaikaInput
              label="Password"
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span>Remember this device</span>
              </label>
              <a href="#" className="text-saffron hover:text-saffron-dark">
                Forgot password?
              </a>
            </div>

            <ZaikaButton type="submit" variant="primary" className="w-full">
              Sign In to Admin
            </ZaikaButton>
          </form>
        </ZaikaCard>

        {/* Demo Credentials */}
        <ZaikaCard className="mt-4 bg-turmeric/10">
          <div className="flex gap-3">
            <Info className="text-saffron flex-shrink-0" size={20} />
            <div>
              <p className="font-medium text-sm mb-2">Demo Admin Access</p>
              <p className="text-sm text-muted-foreground">
                Email: <span className="font-mono">admin@zaika.com</span>
                <br />
                Password: <span className="font-mono">admin123</span>
              </p>
            </div>
          </div>
        </ZaikaCard>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-white/70 hover:text-white">
            ← Back to Design System
          </Link>
        </div>
      </div>
    </div>
  );
}
