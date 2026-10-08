'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://agmumcfifdxwcydzpgqr.supabase.co";
// Ensure this is your valid Anon public key from Supabase Project Settings > API
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnbXVtY2ZpZmR4d2N5ZHpwZ3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzODYzNjAsImV4cCI6MjEwNjk2MjM2MH0.ELpZRnnvULXqzteXCinGoZAY0Nrxau0-6qFb0vI2_iE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('points');

  // Data States
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [competitions, setCompetitions] = useState([]);

  // Point Awarding Form State
  const [pointTarget, setPointTarget] = useState('team'); // 'team' | 'player'
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [pointActionMsg, setPointActionMsg] = useState('');

  // Competition Form State
  const [compName, setCompName] = useState('');
  const [compSport, setCompSport] = useState('');
  const [compType, setCompType] = useState('team'); // 'team' | 'solo'
  const [compDate, setCompDate] = useState('');
  const [compActionMsg, setCompActionMsg] = useState('');

  const router = useRouter();

  useEffect(() => {
    async function verifyAdminAccess() {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        alert("Auth Error: You are not logged in. Please sign in on the home page first.");
        router.push('/');
        return;
      }

      const user = session.user;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (profileError) {
        alert(`Database Error: Could not read profile. ${profileError.message}`);
        router.push('/');
        return;
      }

      if (!profile?.is_admin) {
        alert(`Access Denied: Account ${user.email} does not have admin privileges.`);
        router.push('/');
        return;
      }

      await fetchAdminData();
      setLoading(false);
    }

    verifyAdminAccess();
  }, [router]);

  async function fetchAdminData() {
    // Fetch Teams
    const { data: teamsData } = await supabase
      .from('teams')
      .select('*')
      .order('points', { ascending: false });
    if (teamsData) setTeams(teamsData);

    // Fetch Players/Profiles
    const { data: playersData } = await supabase
      .from('profiles')
      .select('*')
      .order('points', { ascending: false });
    if (playersData) setPlayers(playersData);

    // Fetch Competitions
    const { data: compData } = await supabase
      .from('competitions')
      .select('*')
      .order('created_at', { ascending: false });
    if (compData) setCompetitions(compData);
  }

  // Award Points to Team or Player
  async function handleAddPoints(e) {
    e.preventDefault();
    setPointActionMsg('');

    if (!pointsToAdd) {
      setPointActionMsg('Please enter point value.');
      return;
    }

    const delta = parseInt(pointsToAdd, 10);

    if (pointTarget === 'team') {
      if (!selectedTeamId) {
        setPointActionMsg('Please select a team.');
        return;
      }
      const team = teams.find((t) => t.id === selectedTeamId);
      const newTotal = (team?.points || 0) + delta;

      const { error } = await supabase
        .from('teams')
        .update({ points: newTotal })
        .eq('id', selectedTeamId);

      if (error) {
        setPointActionMsg(`Error: ${error.message}`);
      } else {
        setPointActionMsg(`Success! Updated team ${team.name} score to ${newTotal} pts.`);
        setPointsToAdd('');
        fetchAdminData();
      }
    } else {
      if (!selectedPlayerId) {
        setPointActionMsg('Please select a player.');
        return;
      }
      const player = players.find((p) => p.id === selectedPlayerId);
      const newTotal = (player?.points || 0) + delta;

      const { error } = await supabase
        .from('profiles')
        .update({ points: newTotal })
        .eq('id', selectedPlayerId);

      if (error) {
        setPointActionMsg(`Error: ${error.message}`);
      } else {
        setPointActionMsg(`Success! Updated player ${player.full_name || player.email} score to ${newTotal} pts.`);
        setPointsToAdd('');
        fetchAdminData();
      }
    }
  }

  // Create Competition
  async function handleCreateCompetition(e) {
    e.preventDefault();
    setCompActionMsg('');

    if (!compName || !compSport) {
      setCompActionMsg('Please enter competition title and sport category.');
      return;
    }

    const { error } = await supabase
      .from('competitions')
      .insert([{ 
        title: compName, 
        sport: compSport, 
        type: compType, 
        date: compDate || null 
      }]);

    if (error) {
      setCompActionMsg(`Error creating competition: ${error.message}`);
    } else {
      setCompActionMsg(`Success! Created ${compType.toUpperCase()} competition "${compName}".`);
      setCompName('');
      setCompSport('');
      setCompDate('');
      fetchAdminData();
    }
  }

  // Delete Competition
  async function handleDeleteCompetition(id, title) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    const { error } = await supabase
      .from('competitions')
      .delete()
      .eq('id', id);

    if (error) {
      alert(`Failed to delete competition: ${error.message}`);
    } else {
      fetchAdminData();
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <p className="font-medium animate-pulse">Verifying admin access...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      {/* Header Bar */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Manage team/player standings, competitions, and points.</p>
        </div>
        <a
          href="/"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg border border-slate-700 transition"
        >
          &larr; Back to Main Site
        </a>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto mb-8 flex gap-3 border-b border-slate-800 pb-4">
        <button
          onClick={() => setActiveTab('points')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
            activeTab === 'points'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          ⚡ Manage Points
        </button>
        <button
          onClick={() => setActiveTab('competitions')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
            activeTab === 'competitions'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          🏆 Create & Delete Competitions
        </button>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* TAB 1: POINTS MANAGEMENT */}
        {activeTab === 'points' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl h-fit">
              <h2 className="text-xl font-bold text-white mb-4">➕ Award Points</h2>
              
              {/* Target Switcher */}
              <div className="flex gap-2 mb-4 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPointTarget('team')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                    pointTarget === 'team' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Team Points
                </button>
                <button
                  type="button"
                  onClick={() => setPointTarget('player')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                    pointTarget === 'player' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Player Points
                </button>
              </div>

              <form onSubmit={handleAddPoints} className="space-y-4">
                {pointTarget === 'team' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Select Team
                    </label>
                    <select
                      value={selectedTeamId}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                    >
                      <option value="">-- Select Team --</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.points || 0} pts)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Select Player
                    </label>
                    <select
                      value={selectedPlayerId}
                      onChange={(e) => setSelectedPlayerId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                    >
                      <option value="">-- Select Player --</option>
                      {players.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.full_name || p.email} ({p.points || 0} pts)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Points Difference (+ / -)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 50 or -10"
                    value={pointsToAdd}
                    onChange={(e) => setPointsToAdd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-sm transition shadow-md"
                >
                  Update Score
                </button>

                {pointActionMsg && (
                  <p className={`text-xs mt-2 ${pointActionMsg.startsWith('Success') ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {pointActionMsg}
                  </p>
                )}
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4">
                {pointTarget === 'team' ? 'Live Team Standings' : 'Live Player Standings'}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase">
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">{pointTarget === 'team' ? 'Team Name' : 'Player Name'}</th>
                      <th className="py-3 px-4 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm">
                    {pointTarget === 'team' ? (
                      teams.map((team, idx) => (
                        <tr key={team.id} className="hover:bg-slate-800/50 transition">
                          <td className="py-3 px-4 font-mono text-slate-400">#{idx + 1}</td>
                          <td className="py-3 px-4 font-medium text-white">{team.name}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-400">{team.points || 0}</td>
                        </tr>
                      ))
                    ) : (
                      players.map((player, idx) => (
                        <tr key={player.id} className="hover:bg-slate-800/50 transition">
                          <td className="py-3 px-4 font-mono text-slate-400">#{idx + 1}</td>
                          <td className="py-3 px-4 font-medium text-white">{player.full_name || player.email}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-400">{player.points || 0}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMPETITIONS MANAGEMENT */}
        {activeTab === 'competitions' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl h-fit">
              <h2 className="text-xl font-bold text-white mb-4">🏆 New Competition</h2>
              <form onSubmit={handleCreateCompetition} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. STEM Football Championship"
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Sport Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Football, Chess, Basketball"
                    value={compSport}
                    onChange={(e) => setCompSport(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Event Type
                  </label>
                  <select
                    value={compType}
                    onChange={(e) => setCompType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                  >
                    <option value="team">👥 Team Event</option>
                    <option value="solo">👤 Solo Event</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Event Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={compDate}
                    onChange={(e) => setCompDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-sm transition shadow-md"
                >
                  Create Competition
                </button>

                {compActionMsg && (
                  <p className={`text-xs mt-2 ${compActionMsg.startsWith('Success') ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {compActionMsg}
                  </p>
                )}
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4">Competitions List</h2>
              {competitions.length === 0 ? (
                <p className="text-slate-500 text-sm">No competitions created yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase">
                        <th className="py-3 px-4">Title</th>
                        <th className="py-3 px-4">Sport</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                      {competitions.map((comp) => (
                        <tr key={comp.id} className="hover:bg-slate-800/50 transition">
                          <td className="py-3 px-4 font-medium text-white">{comp.title}</td>
                          <td className="py-3 px-4 text-slate-400">{comp.sport}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                              comp.type === 'solo' ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'
                            }`}>
                              {comp.type === 'solo' ? 'Solo' : 'Team'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400">{comp.date || 'TBD'}</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteCompetition(comp.id, comp.title)}
                              className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white text-xs font-semibold rounded transition"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
