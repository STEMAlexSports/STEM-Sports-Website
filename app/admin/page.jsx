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
  const [leaderboardView, setLeaderboardView] = useState('competition');

  // Competition Form State
  const [compName, setCompName] = useState('');
  const [compSport, setCompSport] = useState('Football');
  const [compType, setCompType] = useState('team');
  const [compDescription, setCompDescription] = useState('');
  const [compDate, setCompDate] = useState('');
  const [compActionMsg, setCompActionMsg] = useState('');

  // Team Form State
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSport, setNewTeamSport] = useState('General');
  const [teamActionMsg, setTeamActionMsg] = useState('');

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

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
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
    if (teamsData) {
      setTeams(teamsData);
      if (teamsData.length > 0 && !selectedTeamId) setSelectedTeamId(teamsData[0].id);
    }

    const { data: playersData } = await supabase.from('profiles').select('*').order('points', { ascending: false });
    if (playersData) {
      setPlayers(playersData);
      if (playersData.length > 0 && !selectedPlayerId) setSelectedPlayerId(playersData[0].id);
    }

    const { data: compData } = await supabase.from('competitions').select('*').order('created_at', { ascending: false });
    if (compData) {
      setCompetitions(compData);
      if (compData.length > 0 && !selectedCompId) setSelectedCompId(compData[0].id);
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

        const { data: existingScore } = await supabase
          .from('competition_scores')
          .select('id, points')
          .eq('competition_id', selectedCompId)
          .eq('student_id', selectedPlayerId)
          .maybeSingle();

        const currentCompPts = existingScore ? (existingScore.points || 0) : 0;
        const newCompPts = currentCompPts + delta;

        // 1. Update competition_scores table
        if (existingScore) {
          await supabase.from('competition_scores').update({ points: newCompPts }).eq('id', existingScore.id);
        } else {
          await supabase.from('competition_scores').insert([{ competition_id: selectedCompId, student_id: selectedPlayerId, points: newCompPts }]);
        }

        // 2. ALSO Sync to competition_participants table (used on main site)
        const { data: existingParticipant } = await supabase
          .from('competition_participants')
          .select('id')
          .eq('competition_id', selectedCompId)
          .eq('student_id', selectedPlayerId)
          .maybeSingle();

        if (existingParticipant) {
          await supabase.from('competition_participants').update({ score: newCompPts }).eq('id', existingParticipant.id);
        } else {
          await supabase.from('competition_participants').insert([{ competition_id: selectedCompId, student_id: selectedPlayerId, score: newCompPts }]);
        }

        // 3. Update student overall total points
        const player = players.find((p) => p.id === selectedPlayerId);
        const newTotal = (player?.points || 0) + delta;
        await supabase.from('profiles').update({ points: newTotal }).eq('id', selectedPlayerId);

        setPointActionMsg(`Success! Student competition points set to ${newCompPts} (Total: ${newTotal}).`);
        setPointsToAdd('');
        fetchAdminData();

      } else {
        // Team Target
        if (!selectedTeamId) {
          setPointActionMsg('Please select a team.');
          return;
        }

        const { data: existingScore } = await supabase
          .from('competition_scores')
          .select('id, points')
          .eq('competition_id', selectedCompId)
          .eq('team_id', selectedTeamId)
          .maybeSingle();

        const currentCompPts = existingScore ? (existingScore.points || 0) : 0;
        const newCompPts = currentCompPts + delta;

        if (existingScore) {
          await supabase.from('competition_scores').update({ points: newCompPts }).eq('id', existingScore.id);
        } else {
          await supabase.from('competition_scores').insert([{ competition_id: selectedCompId, team_id: selectedTeamId, points: newCompPts }]);
        }

        // Sync to competition_participants table
        const { data: existingParticipant } = await supabase
          .from('competition_participants')
          .select('id')
          .eq('competition_id', selectedCompId)
          .eq('team_id', selectedTeamId)
          .maybeSingle();

        if (existingParticipant) {
          await supabase.from('competition_participants').update({ score: newCompPts }).eq('id', existingParticipant.id);
        } else {
          await supabase.from('competition_participants').insert([{ competition_id: selectedCompId, team_id: selectedTeamId, score: newCompPts }]);
        }

        // Update team overall total points
        const team = teams.find((t) => t.id === selectedTeamId);
        const newTotal = (team?.points || 0) + delta;
        await supabase.from('teams').update({ points: newTotal }).eq('id', selectedTeamId);

        setPointActionMsg(`Success! Team competition points set to ${newCompPts} (Total: ${newTotal}).`);
        setPointsToAdd('');
        fetchAdminData();
      }

    } else {
      // Overall Total Points Only
      if (pointTarget === 'student') {
        if (!selectedPlayerId) return setPointActionMsg('Please select a student.');
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
        if (!selectedTeamId) return setPointActionMsg('Please select a team.');
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
    if (!confirm("⚠️ WARNING: Resets ALL student points, team points, and tournament scores to 0. Continue?")) return;

    await supabase.from('profiles').update({ points: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('teams').update({ points: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('competition_scores').update({ points: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('competition_participants').update({ score: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');

    alert("✅ All points have been reset to 0 across the entire site.");
    fetchAdminData();
  }

  // Create Team
  async function handleCreateTeam(e) {
    e.preventDefault();
    setTeamActionMsg('');
    if (!newTeamName.trim()) return setTeamActionMsg('Please enter a team name.');

    const { error } = await supabase.from('teams').insert([{
      name: newTeamName.trim(),
      team_name: newTeamName.trim(),
      sport: newTeamSport,
      points: 0
    }]);

    if (error) setTeamActionMsg(`Error: ${error.message}`);
    else {
      setTeamActionMsg(`Success! Team "${newTeamName}" created.`);
      setNewTeamName('');
      fetchAdminData();
    }
  }

  // Create Competition
  async function handleCreateCompetition(e) {
    e.preventDefault();
    setCompActionMsg('');
    if (!compName.trim()) return setCompActionMsg('Please enter competition title.');

    const { error } = await supabase.from('competitions').insert([{ 
      title: compName.trim(), 
      sport: compSport, 
      type: compType, 
      description: compDescription.trim() || null,
      date: compDate || null 
    }]);

    if (error) setCompActionMsg(`Error: ${error.message}`);
    else {
      setCompActionMsg(`Success! Competition "${compName}" created.`);
      setCompName('');
      setCompDescription('');
      setCompDate('');
      fetchAdminData();
    }
  }

  // Delete Competition
  async function handleDeleteCompetition(id, title) {
    if (!confirm(`Delete competition "${title}"?`)) return;
    const { error } = await supabase.from('competitions').delete().eq('id', id);
    if (error) alert(`Failed to delete: ${error.message}`);
    else fetchAdminData();
  }

  // Submit Manual Donation Record
  async function handleAddDonation(e) {
    e.preventDefault();
    setDonationMsg('');
    if (!donorName || !donationAmount) return setDonationMsg('Please fill in donor name and amount.');

    const { error } = await supabase.from('donations').insert([{
      donor_name: donorName.trim(),
      amount: parseFloat(donationAmount),
      payment_method: paymentMethod,
      reference_number: refNumber.trim() || null,
      status: 'approved'
    }]);

    if (error) setDonationMsg(`Error: ${error.message}`);
    else {
      setDonationMsg(`Success! Donation recorded.`);
      setDonorName('');
      setDonationAmount('');
      setRefNumber('');
      fetchAdminData();
    }
  }

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
          name: team.name || team.team_name,
          subtitle: team.sport || 'Team',
          compPoints: scoreObj ? scoreObj.points || 0 : 0,
          totalPoints: team.points || 0
        };
      }).sort((a, b) => b.compPoints - a.compPoints);
    }
  };

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
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">👑 Admin Control Center</h1>
          <p className="text-slate-400 text-sm mt-1">Manage scores, teams, competitions, and donations.</p>
        </div>
        <a href="/" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg border border-slate-700 transition">
          &larr; Back to Home
        </a>
      </div>

      <div className="max-w-6xl mx-auto mb-8 flex flex-wrap gap-3 border-b border-slate-800 pb-4">
        <button
          onClick={() => setActiveTab('points')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${activeTab === 'points' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
        >
          ⚡ Manage Points
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${activeTab === 'teams' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
        >
          🛡️ Manage Teams ({teams.length})
        </button>
        <button
          onClick={() => setActiveTab('competitions')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${activeTab === 'competitions' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
        >
          🏆 Competitions
        </button>
        <button
          onClick={() => setActiveTab('donations')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${activeTab === 'donations' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
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
                
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Point Context</label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => { setPointContext('competition'); setLeaderboardView('competition'); }}
                      className={`py-1.5 rounded transition ${pointContext === 'competition' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      🏆 In Competition
                    </button>
                    <button
                      type="button"
                      onClick={() => setPointContext('overall')}
                      className={`py-1.5 rounded transition ${pointContext === 'overall' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      ⭐ Overall Total
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Target Type</label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setPointTarget('student')}
                      className={`py-1.5 rounded transition ${pointTarget === 'student' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      👤 Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setPointTarget('team')}
                      className={`py-1.5 rounded transition ${pointTarget === 'team' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      🛡️ Team
                    </button>
                  </div>
                </div>

                <form onSubmit={handleAddPoints} className="space-y-4">
                  {pointContext === 'competition' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Select Competition</label>
                      <select
                        value={selectedCompId}
                        onChange={(e) => setSelectedCompId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm"
                      >
                        <option value="">-- Choose Competition --</option>
                        {competitions.map((c) => (
                          <option key={c.id} value={c.id}>{c.title} ({c.sport})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {pointTarget === 'student' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Select Student</label>
                      <select
                        value={selectedPlayerId}
                        onChange={(e) => setSelectedPlayerId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm"
                      >
                        <option value="">-- Choose Student --</option>
                        {players.map((p) => (
                          <option key={p.id} value={p.id}>{p.full_name || p.email} (Overall: {p.points || 0} pts)</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Select Team</label>
                      <select
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm"
                      >
                        <option value="">-- Choose Team --</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>{t.name || t.team_name} (Overall: {t.points || 0} pts)</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {pointContext === 'competition' && selectedCompId && (selectedPlayerId || selectedTeamId) && (
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">Current Points in Event:</span>
                      <span className="font-bold text-amber-400 text-sm">{getCurrentCompPoints()} pts</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Points (+ / -)</label>
                    <input
                      type="number"
                      placeholder="e.g. 25 or -10"
                      value={pointsToAdd}
                      onChange={(e) => setPointsToAdd(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-sm transition"
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

            {/* Right Panel: Standings */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {leaderboardView === 'competition' 
                      ? `Competition Standings: ${selectedComp?.title || 'Selected Event'}`
                      : leaderboardView === 'overall_students' ? 'Overall Student Standings' : 'Overall Team Standings'}
                  </h2>
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

              {leaderboardView === 'competition' && (
                <div className="overflow-x-auto">
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
                </div>
              )}

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
                          <td className="py-3 px-4 font-medium text-white">{t.name || t.team_name}</td>
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

        {/* TAB 2: TEAMS MANAGEMENT */}
        {activeTab === 'teams' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl h-fit">
              <h2 className="text-xl font-bold text-white mb-4">🛡️ Add New Team</h2>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Team Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Red Dragons"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Sport / Category</label>
                  <select
                    value={newTeamSport}
                    onChange={(e) => setNewTeamSport(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm"
                  >
                    <option value="General">General</option>
                    <option value="Football">Football</option>
                    <option value="Volleyball">Volleyball</option>
                    <option value="Basketball">Basketball</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-sm transition"
                >
                  Create Team
                </button>

                {teamActionMsg && (
                  <p className={`text-xs ${teamActionMsg.startsWith('Success') ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {teamActionMsg}
                  </p>
                )}
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4">All Teams ({teams.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase">
                      <th className="py-3 px-4">Team Name</th>
                      <th className="py-3 px-4">Sport</th>
                      <th className="py-3 px-4 text-right">Total Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm">
                    {teams.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4 font-bold text-white">{t.name || t.team_name}</td>
                        <td className="py-3 px-4 text-slate-400 text-xs">{t.sport || 'General'}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-400">{t.points || 0} pts</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COMPETITIONS */}
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
                    placeholder="Enter overview and guidelines..."
                    value={compDescription}
                    onChange={(e) => setCompDescription(e.target.value)}
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
                      <th className="py-3 px-4">Title</th>
                      <th className="py-3 px-4">Sport</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm">
                    {competitions.map((comp) => (
                      <tr key={comp.id} className="hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4 font-bold text-white">{comp.title}</td>
                        <td className="py-3 px-4 text-slate-300 text-xs">{comp.sport}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-purple-500/20 text-purple-300">
                            {comp.type}
                          </span>
                        </td>
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

        {/* TAB 4: DONATIONS */}
        {activeTab === 'donations' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl h-fit">
              <h2 className="text-xl font-bold text-white mb-4">💳 Record Donation</h2>
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
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase">
                      <th className="py-3 px-4">Donor</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm">
                    {donations.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4 font-medium text-white">{d.donor_name}</td>
                        <td className="py-3 px-4 font-bold text-emerald-400">{d.amount} EGP</td>
                        <td className="py-3 px-4 text-slate-300 text-xs">{d.payment_method}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-400">
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
