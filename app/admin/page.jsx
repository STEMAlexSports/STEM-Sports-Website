'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://agmumcfifdxwcydzpgqr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnbXVtY2ZpZmR4d2N5ZHpwZ3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzODYzNjAsImV4cCI6MjEwNjk2MjM2MH0.ELpZRnnvULXqzteXCinGoZAY0Nrxau0-6qFb0vI2_iE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('points');

  // Data States
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [competitionScores, setCompetitionScores] = useState([]);
  const [donations, setDonations] = useState([]);

  // Point Management Form State
  const [pointContext, setPointContext] = useState('competition'); // 'competition' | 'overall'
  const [pointTarget, setPointTarget] = useState('student'); // 'student' | 'team'
  
  const [selectedCompId, setSelectedCompId] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [pointActionMsg, setPointActionMsg] = useState('');

  // Leaderboard View State
  const [leaderboardView, setLeaderboardView] = useState('competition'); // 'competition' | 'overall_students' | 'overall_teams'

  // Competition Form State
  const [compName, setCompName] = useState('');
  const [compSport, setCompSport] = useState('Football');
  const [compType, setCompType] = useState('team');
  const [compDescription, setCompDescription] = useState('');
  const [compDate, setCompDate] = useState('');
  const [compActionMsg, setCompActionMsg] = useState('');

  // Donation Form State
  const [donorName, setDonorName] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Vodafone Cash');
  const [refNumber, setRefNumber] = useState('');
  const [donationMsg, setDonationMsg] = useState('');

  const router = useRouter();

  useEffect(() => {
    async function verifyAdminAccess() {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        alert("Auth Error: You are not logged in. Please sign in on the main home page first.");
        router.push('/');
        return;
      }

      const user = session.user;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.is_admin) {
        alert("Access Denied: Account does not have admin privileges.");
        router.push('/');
        return;
      }

      await fetchAdminData();
      setLoading(false);
    }

    verifyAdminAccess();
  }, [router]);

  async function fetchAdminData() {
    const { data: teamsData } = await supabase.from('teams').select('*').order('points', { ascending: false });
    if (teamsData) setTeams(teamsData);

    const { data: playersData } = await supabase.from('profiles').select('*').order('points', { ascending: false });
    if (playersData) setPlayers(playersData);

    const { data: compData } = await supabase.from('competitions').select('*').order('created_at', { ascending: false });
    if (compData) {
      setCompetitions(compData);
      if (compData.length > 0 && !selectedCompId) {
        setSelectedCompId(compData[0].id);
      }
    }

    const { data: scoreData } = await supabase.from('competition_scores').select('*');
    if (scoreData) setCompetitionScores(scoreData);

    const { data: donationData } = await supabase.from('donations').select('*').order('created_at', { ascending: false });
    if (donationData) setDonations(donationData);
  }

  // Calculate current competition points for selected student or team
  const getCurrentCompPoints = () => {
    if (!selectedCompId) return 0;
    if (pointTarget === 'student' && selectedPlayerId) {
      const match = competitionScores.find(
        (s) => s.competition_id === selectedCompId && s.student_id === selectedPlayerId
      );
      return match ? match.points || 0 : 0;
    }
    if (pointTarget === 'team' && selectedTeamId) {
      const match = competitionScores.find(
        (s) => s.competition_id === selectedCompId && s.team_id === selectedTeamId
      );
      return match ? match.points || 0 : 0;
    }
    return 0;
  };

  // Handle Point Updates
  async function handleAddPoints(e) {
    e.preventDefault();
    setPointActionMsg('');

    if (!pointsToAdd) {
      setPointActionMsg('Please enter a point value.');
      return;
    }

    const delta = parseInt(pointsToAdd, 10);

    if (pointContext === 'competition') {
      if (!selectedCompId) {
        setPointActionMsg('Please select a competition.');
        return;
      }

      if (pointTarget === 'student') {
        if (!selectedPlayerId) {
          setPointActionMsg('Please select a student.');
          return;
        }

        const currentCompPts = getCurrentCompPoints();
        const newCompPts = currentCompPts + delta;

        // 1. Update/Upsert competition score for student
        const { error: compErr } = await supabase
          .from('competition_scores')
          .upsert([{ 
            competition_id: selectedCompId, 
            student_id: selectedPlayerId, 
            points: newCompPts 
          }], { onConflict: 'competition_id,student_id' });

        if (compErr) {
          setPointActionMsg(`Error updating competition score: ${compErr.message}`);
          return;
        }

        // 2. Also update student total points
        const player = players.find((p) => p.id === selectedPlayerId);
        const newTotal = (player?.points || 0) + delta;

        const { error: totalErr } = await supabase
          .from('profiles')
          .update({ points: newTotal })
          .eq('id', selectedPlayerId);

        if (totalErr) {
          setPointActionMsg(`Updated competition score, but failed total: ${totalErr.message}`);
        } else {
          setPointActionMsg(`Success! Competition points updated to ${newCompPts} and total points to ${newTotal}.`);
          setPointsToAdd('');
          fetchAdminData();
        }

      } else {
        // Team in Competition
        if (!selectedTeamId) {
          setPointActionMsg('Please select a team.');
          return;
        }

        const currentCompPts = getCurrentCompPoints();
        const newCompPts = currentCompPts + delta;

        // 1. Update/Upsert competition score for team
        const { error: compErr } = await supabase
          .from('competition_scores')
          .upsert([{ 
            competition_id: selectedCompId, 
            team_id: selectedTeamId, 
            points: newCompPts 
          }], { onConflict: 'competition_id,team_id' });

        if (compErr) {
          setPointActionMsg(`Error updating competition score: ${compErr.message}`);
          return;
        }

        // 2. Also update team total points
        const team = teams.find((t) => t.id === selectedTeamId);
        const newTotal = (team?.points || 0) + delta;

        const { error: totalErr } = await supabase
          .from('teams')
          .update({ points: newTotal })
          .eq('id', selectedTeamId);

        if (totalErr) {
          setPointActionMsg(`Updated competition score, but failed team total: ${totalErr.message}`);
        } else {
          setPointActionMsg(`Success! Team competition points updated to ${newCompPts} and total points to ${newTotal}.`);
          setPointsToAdd('');
          fetchAdminData();
        }
      }

    } else {
      // Overall Total Points
      if (pointTarget === 'student') {
        if (!selectedPlayerId) {
          setPointActionMsg('Please select a student.');
          return;
        }
        const player = players.find((p) => p.id === selectedPlayerId);
        const newTotal = (player?.points || 0) + delta;

        const { error } = await supabase.from('profiles').update({ points: newTotal }).eq('id', selectedPlayerId);
        if (error) setPointActionMsg(`Error: ${error.message}`);
        else {
          setPointActionMsg(`Success! Updated student total points to ${newTotal}.`);
          setPointsToAdd('');
          fetchAdminData();
        }
      } else {
        if (!selectedTeamId) {
          setPointActionMsg('Please select a team.');
          return;
        }
        const team = teams.find((t) => t.id === selectedTeamId);
        const newTotal = (team?.points || 0) + delta;

        const { error } = await supabase.from('teams').update({ points: newTotal }).eq('id', selectedTeamId);
        if (error) setPointActionMsg(`Error: ${error.message}`);
        else {
          setPointActionMsg(`Success! Updated team total points to ${newTotal}.`);
          setPointsToAdd('');
          fetchAdminData();
        }
      }
    }
  }

  // Clear All Points
  async function handleClearAllPoints() {
    if (!confirm("⚠️ WARNING: This will reset ALL student total points, team total points, and competition scores to 0. Continue?")) return;

    await supabase.from('profiles').update({ points: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('teams').update({ points: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('competition_scores').update({ points: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');

    alert("✅ All points (Students, Teams, & Competitions) have been reset to 0!");
    fetchAdminData();
  }

  // Get Scores for current selected competition for the Leaderboard view
  const getSelectedCompLeaderboard = () => {
    if (!selectedCompId) return [];
    
    const scores = competitionScores.filter((s) => s.competition_id === selectedCompId);

    if (pointTarget === 'student') {
      return players.map((player) => {
        const scoreObj = scores.find((s) => s.student_id === player.id);
        return {
          id: player.id,
          name: player.full_name || player.email,
          subtitle: player.class_name || 'Student',
          compPoints: scoreObj ? scoreObj.points || 0 : 0,
          totalPoints: player.points || 0
        };
      }).sort((a, b) => b.compPoints - a.compPoints);
    } else {
      return teams.map((team) => {
        const scoreObj = scores.find((s) => s.team_id === team.id);
        return {
          id: team.id,
          name: team.team_name || team.name,
          subtitle: team.sport || 'Team',
          compPoints: scoreObj ? scoreObj.points || 0 : 0,
          totalPoints: team.points || 0
        };
      }).sort((a, b) => b.compPoints - a.compPoints);
    }
  };

  // Create Competition
  async function handleCreateCompetition(e) {
    e.preventDefault();
    setCompActionMsg('');

    if (!compName.trim()) {
      setCompActionMsg('Please enter competition title.');
      return;
    }

    const { error } = await supabase.from('competitions').insert([{ 
      title: compName.trim(), 
      sport: compSport, 
      type: compType, 
      description: compDescription.trim() || null,
      date: compDate || null 
    }]);

    if (error) {
      setCompActionMsg(`Error: ${error.message}`);
    } else {
      setCompActionMsg(`Success! Competition "${compName}" created.`);
      setCompName('');
      setCompDescription('');
      setCompDate('');
      fetchAdminData();
    }
  }

  // Delete Competition
  async function handleDeleteCompetition(id, title) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    const { error } = await supabase.from('competitions').delete().eq('id', id);
    if (error) alert(`Failed to delete: ${error.message}`);
    else fetchAdminData();
  }

  // Submit Manual Donation Record
  async function handleAddDonation(e) {
    e.preventDefault();
    setDonationMsg('');

    if (!donorName || !donationAmount) {
      setDonationMsg('Please fill in donor name and amount.');
      return;
    }

    const { error } = await supabase.from('donations').insert([{
      donor_name: donorName.trim(),
      amount: parseFloat(donationAmount),
      payment_method: paymentMethod,
      reference_number: refNumber.trim() || null,
      status: 'approved'
    }]);

    if (error) {
      setDonationMsg(`Error: ${error.message}`);
    } else {
      setDonationMsg(`Success! Donation recorded.`);
      setDonorName('');
      setDonationAmount('');
      setRefNumber('');
      fetchAdminData();
    }
  }

  // Update Donation Status
  async function handleUpdateDonationStatus(id, newStatus) {
    const { error } = await supabase.from('donations').update({ status: newStatus }).eq('id', id);
    if (error) alert(`Failed to update donation: ${error.message}`);
    else fetchAdminData();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <p className="font-medium animate-pulse">Verifying admin access...</p>
      </div>
    );
  }

  const selectedComp = competitions.find(c => c.id === selectedCompId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      {/* Header Bar */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">👑 Admin Control Center</h1>
          <p className="text-slate-400 text-sm mt-1">Manage points, competition scores, teams, and donations.</p>
        </div>
        <a
          href="/"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg border border-slate-700 transition"
        >
          &larr; Back to Home
        </a>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-wrap gap-3 border-b border-slate-800 pb-4">
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
          🏆 Competitions
        </button>
        <button
          onClick={() => setActiveTab('donations')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
            activeTab === 'donations'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          💳 Donations
        </button>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* TAB 1: POINTS MANAGEMENT */}
        {activeTab === 'points' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl h-fit space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-3">➕ Award / Update Points</h2>
                
                {/* Context Switcher: Competition vs Overall */}
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Point Context</label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => { setPointContext('competition'); setLeaderboardView('competition'); }}
                      className={`py-1.5 rounded transition ${
                        pointContext === 'competition' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🏆 In Competition
                    </button>
                    <button
                      type="button"
                      onClick={() => setPointContext('overall')}
                      className={`py-1.5 rounded transition ${
                        pointContext === 'overall' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ⭐ Overall Total
                    </button>
                  </div>
                </div>

                {/* Target Switcher: Student vs Team */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Target Type</label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setPointTarget('student')}
                      className={`py-1.5 rounded transition ${
                        pointTarget === 'student' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      👤 Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setPointTarget('team')}
                      className={`py-1.5 rounded transition ${
                        pointTarget === 'team' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🛡️ Team
                    </button>
                  </div>
                </div>

                <form onSubmit={handleAddPoints} className="space-y-4">
                  {/* Competition Select */}
                  {pointContext === 'competition' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Select Competition</label>
                      <select
                        value={selectedCompId}
                        onChange={(e) => setSelectedCompId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">-- Choose Competition --</option>
                        {competitions.map((c) => (
                          <option key={c.id} value={c.id}>{c.title} ({c.sport})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Student Select */}
                  {pointTarget === 'student' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Select Student</label>
                      <select
                        value={selectedPlayerId}
                        onChange={(e) => setSelectedPlayerId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">-- Choose Student --</option>
                        {players.map((p) => (
                          <option key={p.id} value={p.id}>{p.full_name || p.email} (Overall: {p.points || 0} pts)</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Team Select */}
                  {pointTarget === 'team' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Select Team</label>
                      <select
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">-- Choose Team --</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>{t.team_name || t.name} (Overall: {t.points || 0} pts)</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Show Current Competition Points Badge if selected */}
                  {pointContext === 'competition' && selectedCompId && (selectedPlayerId || selectedTeamId) && (
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">Current Points in Event:</span>
                      <span className="font-bold text-amber-400 text-sm">{getCurrentCompPoints()} pts</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Points Difference (+ / -)</label>
                    <input
                      type="number"
                      placeholder="e.g. 25 or -10"
                      value={pointsToAdd}
                      onChange={(e) => setPointsToAdd(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-sm transition shadow-md"
                  >
                    Update Score
                  </button>

                  {pointActionMsg && (
                    <p className={`text-xs ${pointActionMsg.startsWith('Success') ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {pointActionMsg}
                    </p>
                  )}
                </form>
              </div>

              {/* Clear All Points */}
              <div className="pt-4 border-t border-slate-800">
                <h3 className="text-sm font-bold text-rose-400 mb-2">🚨 Reset Controls</h3>
                <button
                  type="button"
                  onClick={handleClearAllPoints}
                  className="w-full py-2 bg-rose-900/30 hover:bg-rose-600 border border-rose-700/50 text-rose-200 hover:text-white font-semibold text-xs rounded-lg transition"
                >
                  Clear All Points (Students & Teams)
                </button>
              </div>
            </div>

            {/* Right Panel: Standings / Leaderboard */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {leaderboardView === 'competition' 
                      ? `Competition Standings: ${selectedComp?.title || 'Selected Event'}`
                      : leaderboardView === 'overall_students' 
                        ? 'Overall Student Standings' 
                        : 'Overall Team Standings'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Real-time point records and rankings.</p>
                </div>

                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
                  <button
                    onClick={() => setLeaderboardView('competition')}
                    className={`px-3 py-1.5 rounded transition ${leaderboardView === 'competition' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Event Points
                  </button>
                  <button
                    onClick={() => setLeaderboardView('overall_students')}
                    className={`px-3 py-1.5 rounded transition ${leaderboardView === 'overall_students' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    All Students
                  </button>
                  <button
                    onClick={() => setLeaderboardView('overall_teams')}
                    className={`px-3 py-1.5 rounded transition ${leaderboardView === 'overall_teams' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    All Teams
                  </button>
                </div>
              </div>

              {/* View 1: Event Competition Points Table */}
              {leaderboardView === 'competition' && (
                <div className="overflow-x-auto">
                  {!selectedCompId ? (
                    <p className="text-slate-500 text-sm py-4">Please select a competition in the form on the left.</p>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase">
                          <th className="py-3 px-4">Rank</th>
                          <th className="py-3 px-4">{pointTarget === 'student' ? 'Student' : 'Team'}</th>
                          <th className="py-3 px-4">Details</th>
                          <th className="py-3 px-4 text-right">Event Points</th>
                          <th className="py-3 px-4 text-right">Overall Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-sm">
                        {getSelectedCompLeaderboard().map((row, idx) => (
                          <tr key={row.id} className="hover:bg-slate-800/50 transition">
                            <td className="py-3 px-4 font-mono text-slate-400">#{idx + 1}</td>
                            <td className="py-3 px-4 font-medium text-white">{row.name}</td>
                            <td className="py-3 px-4 text-slate-400 text-xs">{row.subtitle}</td>
                            <td className="py-3 px-4 text-right font-bold text-amber-400">{row.compPoints} pts</td>
                            <td className="py-3 px-4 text-right font-semibold text-emerald-400">{row.totalPoints} pts</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* View 2: Overall Students Table */}
              {leaderboardView === 'overall_students' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase">
                        <th className="py-3 px-4">Rank</th>
                        <th className="py-3 px-4">Student Name</th>
                        <th className="py-3 px-4">Class</th>
                        <th className="py-3 px-4 text-right">Total Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                      {players.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-slate-800/50 transition">
                          <td className="py-3 px-4 font-mono text-slate-400">#{idx + 1}</td>
                          <td className="py-3 px-4 font-medium text-white">{p.full_name || p.email}</td>
                          <td className="py-3 px-4 text-slate-400 text-xs">{p.class_name || 'N/A'}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-400">{p.points || 0} pts</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* View 3: Overall Teams Table */}
              {leaderboardView === 'overall_teams' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase">
                        <th className="py-3 px-4">Rank</th>
                        <th className="py-3 px-4">Team Name</th>
                        <th className="py-3 px-4">Sport</th>
                        <th className="py-3 px-4 text-right">Total Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                      {teams.map((t, idx) => (
                        <tr key={t.id} className="hover:bg-slate-800/50 transition">
                          <td className="py-3 px-4 font-mono text-slate-400">#{idx + 1}</td>
                          <td className="py-3 px-4 font-medium text-white">{t.team_name || t.name}</td>
                          <td className="py-3 px-4 text-slate-400 text-xs">{t.sport || 'General'}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-400">{t.points || 0} pts</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chess Tournament 2026"
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Sport / Category</label>
                  <select
                    value={compSport}
                    onChange={(e) => setCompSport(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm"
                  >
                    <option value="Football">Football</option>
                    <option value="Volleyball">Volleyball</option>
                    <option value="Basketball">Basketball</option>
                    <option value="Table Tennis">Table Tennis</option>
                    <option value="Chess">Chess</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Format</label>
                  <select
                    value={compType}
                    onChange={(e) => setCompType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm"
                  >
                    <option value="team">🛡️ Team Event</option>
                    <option value="individual">👤 Solo Event</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Enter event overview, guidelines, and rules..."
                    value={compDescription}
                    onChange={(e) => setCompDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    value={compDate}
                    onChange={(e) => setCompDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-sm transition"
                >
                  Create Competition
                </button>

                {compActionMsg && (
                  <p className={`text-xs ${compActionMsg.startsWith('Success') ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {compActionMsg}
                  </p>
                )}
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4">Competitions List</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase">
                      <th className="py-3 px-4">Title & Description</th>
                      <th className="py-3 px-4">Sport</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm">
                    {competitions.map((comp) => (
                      <tr key={comp.id} className="hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4">
                          <span className="font-bold text-white block">{comp.title}</span>
                          {comp.description && <span className="text-xs text-slate-400 block mt-0.5">{comp.description}</span>}
                        </td>
                        <td className="py-3 px-4 text-slate-300 text-xs">{comp.sport}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                            comp.type === 'individual' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-purple-500/20 text-purple-300'
                          }`}>
                            {comp.type === 'individual' ? '👤 Solo' : '🛡️ Team'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-xs">{comp.date || 'TBD'}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteCompetition(comp.id, comp.title)}
                            className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white text-xs font-semibold rounded transition"
                          >
                            Delete 🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DONATIONS MANAGEMENT */}
        {activeTab === 'donations' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl h-fit">
              <h2 className="text-xl font-bold text-white mb-4">💳 Record Manual Donation</h2>
              <form onSubmit={handleAddDonation} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Donor Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ahmed Ali"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Amount (EGP)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 100"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm"
                  >
                    <option value="Vodafone Cash">Vodafone Cash</option>
                    <option value="InstaPay">InstaPay</option>
                    <option value="Cash">Cash / Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Ref / Transfer No. (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. TXN987654"
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-sm transition"
                >
                  Record Donation
                </button>

                {donationMsg && (
                  <p className={`text-xs ${donationMsg.startsWith('Success') ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {donationMsg}
                  </p>
                )}
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4">Donation Ledger</h2>
              {donations.length === 0 ? (
                <p className="text-slate-500 text-sm">No donation records found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase">
                        <th className="py-3 px-4">Donor</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Method</th>
                        <th className="py-3 px-4">Ref No.</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                      {donations.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-800/50 transition">
                          <td className="py-3 px-4 font-medium text-white">{d.donor_name}</td>
                          <td className="py-3 px-4 font-bold text-emerald-400">{d.amount} EGP</td>
                          <td className="py-3 px-4 text-slate-300 text-xs">{d.payment_method}</td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-xs">{d.reference_number || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                              d.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                              d.status === 'rejected' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {d.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right gap-1 space-x-1">
                            {d.status !== 'approved' && (
                              <button
                                onClick={() => handleUpdateDonationStatus(d.id, 'approved')}
                                className="px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white text-xs rounded"
                              >
                                Approve
                              </button>
                            )}
                            {d.status !== 'rejected' && (
                              <button
                                onClick={() => handleUpdateDonationStatus(d.id, 'rejected')}
                                className="px-2 py-1 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white text-xs rounded"
                              >
                                Reject
                              </button>
                            )}
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
