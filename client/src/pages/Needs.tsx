import { useState, useCallback } from "react";
import { useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NeedCard } from "@/components/NeedCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { getNeeds } from "@/api";

export default function Needs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState(searchParams.get("q") || "");
  const [cat, setCat]     = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort]   = useState("priority");

  // Sync URL ?q param → local input on first load
  useEffect(() => {
    const urlQ = searchParams.get("q") || "";
    setInputValue(urlQ);
  }, []); // eslint-disable-line

  // Debounced search: update URL param 300ms after typing stops
  const handleSearch = useCallback((value: string) => {
    setInputValue(value);
    const timer = setTimeout(() => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (value.trim()) next.set("q", value.trim());
        else next.delete("q");
        return next;
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [setSearchParams]);

  const searchQ = searchParams.get("q") || "";

  // Fetch with backend search if q present — otherwise client-side filter for instant UX
  const { data: allNeeds = [], isLoading } = useQuery({
    queryKey: ["needs"],
    queryFn: () => getNeeds(),
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    let list = allNeeds.filter((n: any) => {
      const matchCat    = cat === "all" || n.category === cat;
      const matchStatus = status === "all" || n.status === status;
      const matchQ      = !searchQ ||
        n.title.toLowerCase().includes(searchQ.toLowerCase()) ||
        (n.description || "").toLowerCase().includes(searchQ.toLowerCase()) ||
        n.category.toLowerCase().includes(searchQ.toLowerCase());
      return matchCat && matchStatus && matchQ;
    });

    list = [...list].sort((a: any, b: any) => {
      if (sort === "priority") return b.priorityScore - a.priorityScore;
      if (sort === "urgency")  return b.urgency - a.urgency;
      if (sort === "people")   return b.peopleAffected - a.peopleAffected;
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });
    return list;
  }, [allNeeds, searchQ, cat, status, sort]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Needs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isLoading ? "Loading…" : `${filtered.length} needs matching filters.`}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 rounded-2xl bg-card border shadow-card p-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={inputValue}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search by title, description, category…"
            className="pl-9"
          />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="food">Food</SelectItem>
            <SelectItem value="medical">Medical</SelectItem>
            <SelectItem value="education">Education</SelectItem>
            <SelectItem value="disaster">Disaster</SelectItem>
            <SelectItem value="logistics">Logistics</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="priority">Priority Score</SelectItem>
            <SelectItem value="urgency">Urgency</SelectItem>
            <SelectItem value="people">People Affected</SelectItem>
            <SelectItem value="date">Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-52 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-card border shadow-card p-12 text-center text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No needs match your filters</p>
          <p className="text-sm mt-1">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((n: any) => <NeedCard key={n._id} need={n} />)}
        </div>
      )}
    </div>
  );
}
