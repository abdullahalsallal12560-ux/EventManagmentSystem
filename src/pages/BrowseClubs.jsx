import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getAllClubs } from "../data/clubsStore";
import {
  getMembershipsByUser,
  getMembershipsByClub,
  requestToJoinClub,
  MEMBERSHIP_STATUS,
} from "../data/clubMembershipsStore";
import PageShell from "../components/PageShell";
import ClubCard from "../components/ClubCard";
import EmptyState from "../components/EmptyState";
import { CardSkeleton } from "../components/Skeleton";
import { useMinimumLoadingTime } from "../utils/useMinimumLoadingTime";

export default function BrowseClubs() {
  const { user } = useAuth();
  const toast = useToast();

  const [clubs, setClubs] = useState([]);
  const [memberCounts, setMemberCounts] = useState({});
  const [myMemberships, setMyMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyClubId, setBusyClubId] = useState(null);
  const [search, setSearch] = useState("");
  const showSkeleton = useMinimumLoadingTime(loading, 400);

  async function loadData() {
    setLoading(true);
    const [clubList, memberships] = await Promise.all([
      getAllClubs(),
      getMembershipsByUser(user.id),
    ]);
    const counts = await Promise.all(clubList.map((c) => getMembershipsByClub(c.id)));
    const countsByClub = {};
    clubList.forEach((c, i) => {
      countsByClub[c.id] = counts[i].filter((m) => m.status === MEMBERSHIP_STATUS.APPROVED).length;
    });

    setClubs(clubList);
    setMemberCounts(countsByClub);
    setMyMemberships(memberships);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function membershipStatusFor(clubId) {
    const membership = myMemberships.find((m) => m.clubId === clubId);
    if (!membership) return "none";
    if (membership.status === MEMBERSHIP_STATUS.REJECTED) return "none";
    return membership.status;
  }

  async function handleRequest(club) {
    setBusyClubId(club.id);
    const result = await requestToJoinClub({ userId: user.id, clubId: club.id });
    setBusyClubId(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`Requested to join ${club.name}.`);
    loadData();
  }

  const visibleClubs = clubs.filter(
    (c) => !search.trim() || c.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <PageShell title="Clubs" subtitle="Find a community to join on campus.">
      <div className="relative mb-6 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clubs..."
          className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ borderColor: "var(--border)", background: "var(--bg-card)", color: "var(--text)", "--tw-ring-color": "var(--accent)" }}
        />
      </div>

      {showSkeleton ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      ) : clubs.length === 0 ? (
        <EmptyState title="No clubs yet" description="Clubs added by the University Admin will show up here." />
      ) : visibleClubs.length === 0 ? (
        <EmptyState title="No clubs match your search" description="Try a different search term." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleClubs.map((club) => (
            <ClubCard
              key={club.id}
              club={club}
              memberCount={memberCounts[club.id] || 0}
              membershipStatus={busyClubId === club.id ? "requesting" : membershipStatusFor(club.id)}
              onRequest={handleRequest}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
