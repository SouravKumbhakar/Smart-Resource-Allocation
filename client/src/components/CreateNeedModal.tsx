import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createNeed } from "@/api";
import { toast } from "sonner";

export function CreateNeedModal({ open, onOpenChange, lat, lng }: { open: boolean, onOpenChange: (v: boolean) => void, lat: number, lng: number }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "food",
    urgency: 3,
    peopleAffected: 10,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () => createNeed({
      ...formData,
      location: { lat, lng }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["needs"] });
      toast.success("Need created successfully");
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err.message || "Failed to create need")
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Custom Need</DialogTitle>
          <DialogDescription>
            Add a new need at location: {lat.toFixed(4)}, {lng.toFixed(4)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Emergency Medical Supplies" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="disaster">Disaster</SelectItem>
                  <SelectItem value="logistics">Logistics</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Urgency (1-5)</Label>
              <Input type="number" min="1" max="5" required value={formData.urgency} onChange={e => setFormData({...formData, urgency: +e.target.value})} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>People Affected</Label>
            <Input type="number" min="1" required value={formData.peopleAffected} onChange={e => setFormData({...formData, peopleAffected: +e.target.value})} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>{isPending ? "Creating..." : "Create Need"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
