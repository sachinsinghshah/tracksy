"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { UserPreferences } from "@/types/database";

interface SettingsFormProps {
  initialPreferences: UserPreferences | null;
}

export function SettingsForm({ initialPreferences }: SettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    email_notifications: initialPreferences?.email_notifications ?? true,
    notification_frequency: initialPreferences?.notification_frequency ?? "immediate",
    price_drop_threshold: initialPreferences?.price_drop_threshold ?? 0,
    daily_digest: initialPreferences?.daily_digest ?? false,
    weekly_summary: initialPreferences?.weekly_summary ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }

      toast.success("Settings updated successfully!");
    } catch (error) {
      toast.error("Failed to update settings");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [field]: checked,
    }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setPreferences(prev => ({
      ...prev,
      [field]: field === "price_drop_threshold" ? parseFloat(value) || 0 : value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Notifications */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="email_notifications"
            checked={preferences.email_notifications}
            onCheckedChange={(checked) => 
              handleCheckboxChange("email_notifications", checked as boolean)
            }
          />
          <Label htmlFor="email_notifications" className="text-sm font-medium">
            Enable email notifications
          </Label>
        </div>
        <p className="text-sm text-muted-foreground ml-6">
          Receive email alerts when product prices drop below your target
        </p>
      </div>

      {/* Notification Frequency */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Notification Frequency</Label>
        <Select
          value={preferences.notification_frequency}
          onValueChange={(value) => handleSelectChange("notification_frequency", value)}
          disabled={!preferences.email_notifications}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="immediate">Immediate</SelectItem>
            <SelectItem value="hourly">Hourly digest</SelectItem>
            <SelectItem value="daily">Daily digest</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          How often you want to receive price drop notifications
        </p>
      </div>

      {/* Price Drop Threshold */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Minimum Price Drop Threshold ($)
        </Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={preferences.price_drop_threshold}
          onChange={(e) => handleInputChange("price_drop_threshold", e.target.value)}
          disabled={!preferences.email_notifications}
        />
        <p className="text-sm text-muted-foreground">
          Only send notifications for price drops above this amount (0 = any drop)
        </p>
      </div>

      {/* Daily Digest */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="daily_digest"
            checked={preferences.daily_digest}
            onCheckedChange={(checked) => 
              handleCheckboxChange("daily_digest", checked as boolean)
            }
            disabled={!preferences.email_notifications}
          />
          <Label htmlFor="daily_digest" className="text-sm font-medium">
            Daily digest email
          </Label>
        </div>
        <p className="text-sm text-muted-foreground ml-6">
          Receive a daily summary of all your tracked products and price changes
        </p>
      </div>

      {/* Weekly Summary */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="weekly_summary"
            checked={preferences.weekly_summary}
            onCheckedChange={(checked) => 
              handleCheckboxChange("weekly_summary", checked as boolean)
            }
            disabled={!preferences.email_notifications}
          />
          <Label htmlFor="weekly_summary" className="text-sm font-medium">
            Weekly summary email
          </Label>
        </div>
        <p className="text-sm text-muted-foreground ml-6">
          Receive a weekly report with price trends and savings summary
        </p>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  );
}