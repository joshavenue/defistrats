import React, { useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserPlus } from "lucide-react";

interface Props {
  onSuccessfulAdd?: () => void;
}

export const AdminAddUserDialog: React.FC<Props> = ({ onSuccessfulAdd }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [type, setType] = useState<"admin"|"superadmin">("admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Call the edge function instead of direct supabase.auth.admin.createUser
    const { data, error } = await supabase.functions.invoke("create-admin-user", {
      body: {
        email,
        fullName,
        type,
        password,
      },
    });

    setLoading(false);
    if (error || data?.error) {
      toast({
        title: "Error",
        description: error?.message || data?.error || "Unable to create admin user.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Added",
      description: `${email} was added as ${type}.`
    });
    setOpen(false);
    setEmail("");
    setFullName("");
    setPassword("");
    setType("admin");
    onSuccessfulAdd && onSuccessfulAdd();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="flex items-center gap-2">
          <UserPlus size={18} /> Add Admin User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>Add Admin User</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-user-email">Email</Label>
            <Input
              type="email"
              id="new-user-email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-user-name">Full Name</Label>
            <Input
              type="text"
              id="new-user-name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-user-password">Password</Label>
            <Input
              type="password"
              id="new-user-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label>User Type</Label>
            <RadioGroup
              value={type}
              onValueChange={v => setType(v as "admin" | "superadmin")}
              className="flex gap-5 mt-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="admin" id="admin-radio" />
                <Label htmlFor="admin-radio">Admin</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="superadmin" id="superadmin-radio" />
                <Label htmlFor="superadmin-radio">Superadmin</Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
            </DialogClose>
            <Button
              type="submit"
              variant="default"
              disabled={loading}
              className="ml-2"
            >
              {loading ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
