"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase/api";
import { useAuth } from "../../../features/auth/hooks/useAuth";

export default function AllTradesPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null); // null = no data yet
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchStats = async () => {
      try {
        // 1. Get all events for the user
        const { data: events, error: eventsError } = await supabase
          .from("trade_events")
          .select("id")
          .eq("user_id", user.id);

        if (eventsError) throw eventsError;

        if (!events || events.length === 0) {
          if (!cancelled) setStats(null);
          return;
        }

        const eventIds = events.map((e) => e.id);

        // 2. Get all sessions for those events
        const { data: sessions, error: sessionsError } = await supabase
          .from("trade_sessions")
          .select("id")
          .in("event_id", eventIds);

        if (sessionsError) throw sessionsError;

        if (!sessions || sessions.length === 0) {
          if (!cancelled) setStats(null);
          return;
        }

        const sessionIds = sessions.map((s) => s.id);

        // 3. Get all trade items for those sessions
        const { data: items, error: itemsError } = await supabase
          .from("trade_items")
          .select("direction, trade_price, quantity")
          .in("session_id", sessionIds);

        if (itemsError) throw itemsError;

        console.log("Trade items fetched:", items);

        if (!items || items.length === 0) {
          if (!cancelled) setStats(null);
          return;
        }

        const cardsIn = items.filter((i) => i.direction === "in");
        const cardsOut = items.filter((i) => i.direction === "out");

        setStats({
          totalInValue: cardsIn.reduce(
            (s, i) => s + Number(i.trade_price) * (i.quantity || 1),
            0,
          ),
          totalOutValue: cardsOut.reduce(
            (s, i) => s + Number(i.trade_price) * (i.quantity || 1),
            0,
          ),
          cardsIn: cardsIn.length,
          cardsOut: cardsOut.length,
          profit:
            cardsIn.reduce(
              (s, i) => s + Number(i.trade_price) * (i.quantity || 1),
              0,
            ) -
            cardsOut.reduce(
              (s, i) => s + Number(i.trade_price) * (i.quantity || 1),
              0,
            ),
        });
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Safety timeout (just in case)
    const timer = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 8000);

    fetchStats();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-red-400">Failed to load stats: {error}</p>
        </div>
      </div>
    );
  }

  if (!stats || (stats.cardsIn === 0 && stats.cardsOut === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-white mb-4">
            Trade Statistics
          </h1>
          <p className="text-gray-400">
            No trades recorded yet. Complete a trade from the Trading page to
            see stats here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Trade Statistics</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Cards Traded In" value={stats.cardsIn} />
          <StatCard label="Cards Traded Out" value={stats.cardsOut} />
          <StatCard
            label="Total In Value"
            value={`€${stats.totalInValue.toFixed(2)}`}
          />
          <StatCard
            label="Total Out Value"
            value={`€${stats.totalOutValue.toFixed(2)}`}
          />
          <StatCard
            label="Overall Profit"
            value={`€${stats.profit.toFixed(2)}`}
            positive={stats.profit >= 0}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, positive }) {
  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center">
      <p className="text-gray-400 text-sm">{label}</p>
      <p
        className={`text-2xl font-bold mt-2 ${
          positive === true
            ? "text-green-400"
            : positive === false
              ? "text-red-400"
              : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
