import { useState } from "react";
import { ZaikaButton } from "../../components/zaika/ZaikaButton";
import { ZaikaInput } from "../../components/zaika/ZaikaInput";
import { ZaikaCard } from "../../components/zaika/ZaikaCard";
import { LanguageToggle } from "../../components/zaika/LanguageToggle";
import { User, Mail, Phone, MapPin, Bell } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const [name, setName] = useState("Rajesh Kumar");
  const [email, setEmail] = useState("rajesh@example.com");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [address, setAddress] = useState("123 MG Road, Bangalore");

  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: false,
    newsletter: true,
  });

  const handleSave = () => {
    toast.success("Profile updated successfully");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="mb-8">Profile & Settings</h2>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Avatar Section */}
        <div className="md:col-span-1">
          <ZaikaCard>
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-saffron to-saffron-dark flex items-center justify-center mx-auto mb-4">
                <User className="text-white" size={40} />
              </div>
              <h3 className="mb-1">{name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{email}</p>
              <ZaikaButton variant="secondary" size="sm" className="w-full">
                Change Photo
              </ZaikaButton>
            </div>
          </ZaikaCard>
        </div>

        {/* Profile Information */}
        <div className="md:col-span-2 space-y-6">
          <ZaikaCard>
            <h3 className="mb-6">Personal Information</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-cream flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="text-saffron" size={20} />
                </div>
                <div className="flex-1">
                  <ZaikaInput
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-cream flex items-center justify-center flex-shrink-0 mt-1">
                  <Mail className="text-saffron" size={20} />
                </div>
                <div className="flex-1">
                  <ZaikaInput
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-cream flex items-center justify-center flex-shrink-0 mt-1">
                  <Phone className="text-saffron" size={20} />
                </div>
                <div className="flex-1">
                  <ZaikaInput
                    label="Phone Number"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-cream flex items-center justify-center flex-shrink-0 mt-1">
                  <MapPin className="text-saffron" size={20} />
                </div>
                <div className="flex-1">
                  <ZaikaInput
                    label="Delivery Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </ZaikaCard>

          <ZaikaCard>
            <h3 className="mb-6">Language Preference</h3>
            <div className="flex items-center gap-4">
              <LanguageToggle />
              <p className="text-sm text-muted-foreground">
                Choose your preferred language for the app interface
              </p>
            </div>
          </ZaikaCard>

          <ZaikaCard>
            <h3 className="mb-6">Notification Settings</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <Bell className="text-saffron" size={20} />
                  <div>
                    <p className="font-medium group-hover:text-saffron">
                      Order Updates
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Get notified about your order status
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.orderUpdates}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      orderUpdates: e.target.checked,
                    })
                  }
                  className="w-12 h-6 appearance-none bg-cream-dark rounded-full relative cursor-pointer transition-colors checked:bg-saffron before:content-[''] before:absolute before:w-5 before:h-5 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-transform checked:before:translate-x-6"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <Bell className="text-saffron" size={20} />
                  <div>
                    <p className="font-medium group-hover:text-saffron">
                      Promotions & Offers
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Receive special deals and discounts
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.promotions}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      promotions: e.target.checked,
                    })
                  }
                  className="w-12 h-6 appearance-none bg-cream-dark rounded-full relative cursor-pointer transition-colors checked:bg-saffron before:content-[''] before:absolute before:w-5 before:h-5 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-transform checked:before:translate-x-6"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <Bell className="text-saffron" size={20} />
                  <div>
                    <p className="font-medium group-hover:text-saffron">
                      Newsletter
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Weekly updates about new menu items
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.newsletter}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      newsletter: e.target.checked,
                    })
                  }
                  className="w-12 h-6 appearance-none bg-cream-dark rounded-full relative cursor-pointer transition-colors checked:bg-saffron before:content-[''] before:absolute before:w-5 before:h-5 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-transform checked:before:translate-x-6"
                />
              </label>
            </div>
          </ZaikaCard>

          <div className="flex gap-3">
            <ZaikaButton variant="secondary" className="flex-1">
              Cancel
            </ZaikaButton>
            <ZaikaButton
              variant="primary"
              className="flex-1"
              onClick={handleSave}
            >
              Save Changes
            </ZaikaButton>
          </div>
        </div>
      </div>
    </div>
  );
}
