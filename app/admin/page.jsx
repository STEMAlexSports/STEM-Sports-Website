'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://agmumcfifdxwcydzpgqr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnbXVtY2ZpZmR4d2N5ZHpwZ3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzODYzNjAsImV4cCI6MjE0Njk2MjM2MH0.ELpZRnnvULXqzteXCinGoZAY0Nrxau0-6qFb0vI2_iE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('points');

  // Data States
  const [sportsList, setSportsList] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [competitionScores, setCompetitionScores] = useState([]);
  const [fundraising, setFundraising] = useState([]);
  const [donations, setDonations] = useState([]);
  const [knockoutMatches, setKnockoutMatches] = useState([]);

  // Sports CRUD Form State
  const [newSportName, setNewSportName] = useState('');
  const [newSportEmoji, setNewSportEmoji] = useState('🏆');

  // Knockout Bracket State
  const [selectedCompIdForBracket, setSelectedCompIdForBracket] = useState('');

  // Point Management Form State
  const [pointContext, setPointContext] = useState('competition');
  const [pointTarget, setPointTarget] = useState('student');
  
  const [selectedCompId, setSelectedCompId] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [pointActionMsg, setPointActionMsg] = useState('');

  // Leaderboard View State
  const [leaderboardView, setLeaderboardView] = useState('competition');

  // Competition Form State
  const [compName, setCompName] = useState('');
  const [compSport, setCompSport] = useState('');
  const [compType, setCompType] = useState('team');
  const [compDescription, setCompDescription] = useState('');
  const [compDate, setCompDate] = useState('');
  const [compActionMsg, setCompActionMsg] = useState('');

  // Team Form State
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSport, setNewTeamSport] = useState('');
  const [teamActionMsg, setTeamActionMsg] = useState('');

  // Fundraising Goal Form State
  const [editingFundId, setEditingFundId] = useState(null);
  const [fundItemName, setFundItemName] = useState('');
  const [fundTargetAmount, setFundTargetAmount] = useState('');
  const [fundRaisedAmount, setFundRaisedAmount] = useState('0');
  const [fundDescription, setFundDescription] = useState('');
  const [fundActionMsg, setFundActionMsg] = useState('');

  // Manual Donation Entry State
  const [donorName, setDonorName] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Vodafone Cash');
  const [refNumber, setRefNumber] = useState('');
  const [selectedFundIdForDonation, setSelectedFundIdForDonation] = useState('');
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

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile && profile.is_admin === false) {
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
    const { data: sportsData } = await supabase.from('sports').select('*').order('name', { ascending: true });
    const { data: teamsData } = await supabase.from('teams').select('*').order('points', { ascending: false });
    const { data: playersData } = await supabase.from('profiles').select('*').order('points', { ascending: false });
    const { data: compData } = await supabase.from('competitions').select('*').order('created_at', { ascending: false });
    const { data: scoreData } = await supabase.from('competition_scores').select('*');
    const { data: fundData } = await supabase.from('fundraising').select('*').order('created_at', { ascending: false });
    const { data: donationData } = await supabase.from('donations').select('*, fundraising(item_name), profiles(full_name, email)').order('created_at', { ascending: false });
    const { data: kmData } = await supabase.from('knockout_matches').select('*');

    if (sportsData && sportsData.length > 0) {
      setSportsList(sportsData);
      setCompSport((prev) => prev || sportsData[0].name);
      setNewTeamSport((prev) => prev || sportsData[0].name);
    }

    if (teamsData) {
      setTeams(teamsData);
      if (teamsData.length > 0 && !selectedTeamId) setSelectedTeamId(teamsData[0].id);
    }

    if (playersData) {
      setPlayers(playersData);
      if (playersData.length > 0 && !selectedPlayerId) setSelectedPlayerId(playersData[0].id);
    }

    if (compData && compData.length > 0) {
      setCompetitions(compData);
      if (!selectedCompId) setSelectedCompId(compData[0].id);
      if (!selectedCompIdForBracket) setSelectedCompIdForBracket(compData[0].id);
    }

    if (scoreData) setCompetitionScores(scoreData);
    if (fundData) setFundraising(fundData);
    if (donationData) setDonations(donationData);
    if (kmData) setKnockoutMatches(kmData);
  }

  // --- KNOCKOUT BRACKET HANDLER ---
  async function handleUpdateBracketMatch(matchKey, team1Id, team2Id, winnerId) {
    const selectedComp = competitions.find(c => c.id === selectedCompIdForBracket);
    const sportName = selectedComp?.sport || 'Football';

    const { error } = await supabase.from('knockout_matches').upsert(
      [
        {
          competition_id: selectedCompIdForBracket || null,
          sport: sportName,
          match_key: matchKey,
          team1_id: team1Id || null,
          team2_id: team2Id || null,
          winner_id: winnerId || null,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: selectedCompIdForBracket ? 'competition_id, match_key' : 'sport, match_key' }
    );

    if (error) alert('Error updating bracket slot: ' + error.message);
    else fetchAdminData();
  }

  // --- SPORTS MANAGEMENT HANDLERS ---
  async function handleAddSport(e) {
    e.preventDefault();
    if (!newSportName.trim()) return;

    const { error } = await supabase.from('sports').insert([{
      name: newSportName.trim(),
      emoji: newSportEmoji.trim() || '🏆'
    }]);

    if (error) {
      alert('Error adding sport: ' + error.message);
    } else {
      setNewSportName('');
      setNewSportEmoji('🏆');
      fetchAdminData();
    }
  }

  async function handleDeleteSport(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}" from sports?`)) return;
    const { error } = await supabase.from('sports').delete().eq('id', id);
    if (error) alert('Delete failed: ' + error.message);
    else fetchAdminData();
  }

  // --- POINTS HANDLERS ---
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

  async function handleAddPoints(e) {
    e.preventDefault();
    setPointActionMsg('');

    if (!pointsToAdd) {
      setPointActionMsg('Please enter a point value.');
      return;
    }

    const delta = parseInt(pointsToAdd, 10);

    if (pointContext === 'competition') {
      if (!selectedCompId) return setPointActionMsg('Please select a competition.');

      if (pointTarget === 'student') {
        if (!selectedPlayerId) return setPointActionMsg('Please select a student.');

        const { data: existingScore } = await supabase
          .from('competition_scores')
          .select('id, points')
          .eq('competition_id', selectedCompId)
          .eq('student_id', selectedPlayerId)
          .maybeSingle();

        const currentCompPts = existingScore ? (existingScore.points || 0) : 0;
        const newCompPts = currentCompPts + delta;

        if (existingScore) {
          await supabase.from('competition_scores').update({ points: newCompPts }).eq('id', existingScore.id);
        } else {
          await supabase.from('competition_scores').insert([{ competition_id: selectedCompId, student_id: selectedPlayerId, points: newCompPts }]);
        }

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

        const player = players.find((p) => p.id === selectedPlayerId);
        const newTotal = (player?.points || 0) + delta;
        await supabase.from('profiles').update({ points: newTotal }).eq('id', selectedPlayerId);

        setPointActionMsg(`Success! Student points updated.`);
        setPointsToAdd('');
        fetchAdminData();
      } else {
        if (!selectedTeamId) return setPointActionMsg('Please select a team.');

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

        const team = teams.find((t) => t.id === selectedTeamId);
        const newTotal = (team?.points || 0) + delta;
        await supabase.from('teams').update({ points: newTotal }).eq('id', selectedTeamId);

        setPointActionMsg(`Success! Team points updated.`);
        setPointsToAdd('');
        fetchAdminData();
      }
    } else {
      if (pointTarget === 'student') {
        if (!selectedPlayerId) return setPointActionMsg('Please select a student.');
        const player = players.find((p) => p.id === selectedPlayerId);
        const newTotal = (player?.points || 0) + delta;

        const { error } = await supabase.from('profiles').update({ points: newTotal }).eq('id', selectedPlayerId);
        if (error) setPointActionMsg(`Error: ${error.message}`);
        else {
          setPointActionMsg(`Success! Student total updated to ${newTotal}.`);
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
          setPointActionMsg(`Success! Team total updated to ${newTotal}.`);
          setPointsToAdd('');
          fetchAdminData();
        }
      }
    }
  }

  async function handleClearAllPoints() {
    if (!confirm("⚠️ RESET WARNING: Continue to clear ALL student, team, and tournament points to 0?")) return;

    await supabase.from('profiles').update({ points: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('teams').update({ points: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('competition_scores').update({ points: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('competition_participants').update({ score: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');

    alert("✅ All system points reset to 0.");
    fetchAdminData();
  }

  async function handleCreateTeam(e) {
    e.preventDefault();
    setTeamActionMsg('');
    if (!newTeamName.trim()) return setTeamActionMsg('Please enter a team name.');

    const { error } = await supabase.from('teams').insert([{
      name: newTeamName.trim(),
      team_name: newTeamName.trim(),
      sport: newTeamSport || (sportsList[0]?.name || 'Football'),
      points: 0
    }]);

    if (error) setTeamActionMsg(`Error: ${error.message}`);
    else {
      setTeamActionMsg(`Success! Team "${newTeamName}" created.`);
      setNewTeamName('');
      fetchAdminData();
    }
  }

  async function handleCreateCompetition(e) {
    e.preventDefault();
    setCompActionMsg('');
    if (!compName.trim()) return setCompActionMsg('Please enter competition title.');

    const selectedSportName = compSport || (sportsList[0]?.name || 'Football');

    const { error } = await supabase.from('competitions').insert([{ 
      title: compName.trim(), 
      sport: selectedSportName, 
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

  async function handleDeleteCompetition(id, title) {
    if (!confirm(`Delete competition "${title}"?`)) return;
    const { error } = await supabase.from('competitions').delete().eq('id', id);
    if (error) alert(`Failed to delete: ${error.message}`);
    else fetchAdminData();
  }

  // --- FUNDRAISING HANDLERS ---
  async function handleSaveFundraising(e) {
    e.preventDefault();
    setFundActionMsg('');

    if (!fundItemName.trim()) return setFundActionMsg('Item name is required.');
    if (!fundTargetAmount || parseFloat(fundTargetAmount) <= 0) return setFundActionMsg('Enter a valid target amount.');

    const targetVal = parseFloat(fundTargetAmount);
    const raisedVal = parseFloat(fundRaisedAmount) || 0;

    if (editingFundId) {
      const { error } = await supabase
        .from('fundraising')
        .update({
          item_name: fundItemName.trim(),
          target_amount: targetVal,
          raised_amount: raisedVal,
          description: fundDescription.trim() || null
        })
        .eq('id', editingFundId);

      if (error) setFundActionMsg(`Error: ${error.message}`);
      else {
        setFundActionMsg(`Success! Campaign "${fundItemName}" updated.`);
        resetFundForm();
        fetchAdminData();
      }
    } else {
      const { error } = await supabase
        .from('fundraising')
        .insert([{
          item_name: fundItemName.trim(),
          target_amount: targetVal,
          raised_amount: raisedVal,
          description: fundDescription.trim() || null
        }]);

      if (error) setFundActionMsg(`Error: ${error.message}`);
      else {
        setFundActionMsg(`Success! Campaign "${fundItemName}" created.`);
        resetFundForm();
        fetchAdminData();
      }
    }
  }

  function resetFundForm() {
    setEditingFundId(null);
    setFundItemName('');
    setFundTargetAmount('');
    setFundRaisedAmount('0');
    setFundDescription('');
  }

  function startEditingFund(item) {
    setEditingFundId(item.id);
    setFundItemName(item.item_name || '');
    setFundTargetAmount(item.target_amount?.toString() || '');
    setFundRaisedAmount(item.raised_amount?.toString() || '0');
    setFundDescription(item.description || '');
    setFundActionMsg('');
  }

  async function handleDeleteFundraising(id, name) {
    if (!confirm(`Delete campaign "${name}"?`)) return;

    const { error } = await supabase.from('fundraising').delete().eq('id', id);
    if (error) alert(`Failed to delete: ${error.message}`);
    else {
      if (editingFundId === id) resetFundForm();
      fetchAdminData();
    }
  }

  async function handleQuickUpdateProgress(id, currentTarget, currentRaised, deltaAmount) {
    const newRaised = Math.max(0, currentRaised + deltaAmount);
    const { error } = await supabase
      .from('fundraising')
      .update({ raised_amount: newRaised })
      .eq('id', id);

    if (error) alert(`Update failed: ${error.message}`);
    else fetchAdminData();
  }

  // --- DONATIONS HANDLERS ---
  async function handleAddDonation(e) {
    e.preventDefault();
    setDonationMsg('');
    if (!donorName || !donationAmount) return setDonationMsg('Please fill in donor name and amount.');

    const amt = parseFloat(donationAmount);
    const { error } = await supabase.from('donations').insert([{
      donor_name: donorName.trim(),
      amount: amt,
      payment_method: paymentMethod,
      reference_number: refNumber.trim() || null,
      item_id: selectedFundIdForDonation || null,
      status: 'approved'
    }]);

    if (error) setDonationMsg(`Error: ${error.message}`);
    else {
      if (selectedFundIdForDonation) {
        const item = fundraising.find(f => f.id === selectedFundIdForDonation);
        if (item) {
          const newRaised = (item.raised_amount || 0) + amt;
          await supabase.from('fundraising').update({ raised_amount: newRaised }).eq('id', selectedFundIdForDonation);
        }
      }
      setDonationMsg(`Success! Donation recorded.`);
      setDonorName('');
      setDonationAmount('');
      setRefNumber('');
      setSelectedFundIdForDonation('');
      fetchAdminData();
    }
  }

  async function handleApproveStudentDonation(donation, approve) {
    if (approve) {
      const { error: donErr } = await supabase
        .from('donations')
        .update({ status: 'approved' })
        .eq('id', donation.id);

      if (donErr) return alert('Error approving donation: ' + donErr.message);

      if (donation.item_id) {
        const item = fundraising.find((i) => i.id === donation.item_id);
        const newTotal = (Number(item?.raised_amount) || 0) + Number(donation.amount);

        await supabase
          .from('fundraising')
          .update({ raised_amount: newTotal })
          .eq('id', donation.item_id);
      }

      if (donation.student_id) {
        const student = players.find((s) => s.id === donation.student_id);
        if (student) {
          await supabase
            .from('profiles')
            .update({ points: (student.points || 0) + 10 })
            .eq('id', donation.student_id);
        }
      }

      alert('Donation approved successfully!');
    } else {
      const { error: donErr } = await supabase
        .from('donations')
        .update({ status: 'rejected' })
        .eq('id', donation.id);

      if (donErr) return alert('Error rejecting donation: ' + donErr.message);
      alert('Donation request rejected.');
    }
    fetchAdminData();
  }

  async function handleDeleteDonation(id) {
    if (!confirm('Delete this donation record?')) return;
    const { error } = await supabase.from('donations').delete().eq('id', id);
    if (error) alert('Delete failed: ' + error.message);
    else fetchAdminData();
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
  const pendingDonationRequests = donations.filter(d => d.status === 'pending');

  const activeBracketComp = competitions.find(c => c.id === selectedCompIdForBracket);
  const BRACKET_MATCH_KEYS = [
    { key: 'QF1', label: 'Quarterfinal 1 (Left)' },
    { key: 'QF2', label: 'Quarterfinal 2 (Left)' },
    { key: 'QF3', label: 'Quarterfinal 3 (Right)' },
    { key: 'QF4', label: 'Quarterfinal 4 (Right)' },
    { key: 'SF1', label: 'Semifinal 1 (Left Winner QF1 vs QF2)' },
    { key: 'SF2', label: 'Semifinal 2 (Right Winner QF3 vs QF4)' },
    { key: 'FINAL', label: 'Grand Final (Winner SF1 vs SF2)' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">👑 Admin Control Center</h1>
          <p className="text-slate-400 text-sm mt-1">Manage scores, sports, teams, competitions, equipment goals & donations.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/knockout" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-black rounded-lg transition shadow-lg">
            🏆 Knockout Page →
          </Link>
          <Link href="/" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg border border-slate-700 transition">
            &larr; Back to Home
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-wrap gap-3 border-b border-slate-800 pb-4">
        <button
          onClick={() => setActiveTab('points')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${activeTab === 'points' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
        >
          ⚡ Manage Points
        </button>
        <button
          onClick={() => setActiveTab('brackets')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${activeTab === 'brackets' ? 'bg-amber-500 text-slate-950 font-black shadow-lg' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
        >
          🥊 Knockout Brackets
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${activeTab === 'teams' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
        >
          🛡️ Manage Teams ({teams.length})
        </button>
        <button
          onClick={() => setActiveTab('competitions')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${activeTab === 'competitions' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
        >
          🏆 Competitions ({competitions.length})
        </button>
        <button
          onClick={() => setActiveTab('donations')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition relative ${activeTab === 'donations' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
        >
          💰 Donations & Goals ({fundraising.length})
          {pendingDonationRequests.length > 0 && (
            <span className="ml-2 bg-amber-500 text-slate-950 font-black text-xxs px-2 py-0.5 rounded-full">
              {pendingDonationRequests.length}
            </span>
          )}
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
                      🏆 Competition
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

        {/* TAB 2: KNOCKOUT BRACKET CONTROLLER */}
        {activeTab === 'brackets' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 p-5 rounded-2xl border border-slate-800 gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>🥊</span> Tournament Bracket Controller
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Select a Competition to set matchups and declare round winners.</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Select Competition:</span>
                <select
                  value={selectedCompIdForBracket}
                  onChange={(e) => setSelectedCompIdForBracket(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-sm font-bold text-amber-300 rounded-xl p-2.5 focus:outline-none"
                >
                  {competitions.length === 0 && <option value="">No competitions created yet</option>}
                  {competitions.map((c) => (
                    <option key={c.id} value={c.id}>
                      🏆 {c.title} ({c.sport})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {activeBracketComp && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-200 flex justify-between items-center">
                <span>Currently Managing Bracket for: <strong>{activeBracketComp.title}</strong></span>
                <span className="bg-amber-500/20 px-2 py-0.5 rounded font-bold text-amber-300">Sport: {activeBracketComp.sport}</span>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {BRACKET_MATCH_KEYS.map(({ key, label }) => {
                const match = knockoutMatches.find(
                  (m) => (selectedCompIdForBracket ? m.competition_id === selectedCompIdForBracket : m.sport === activeBracketComp?.sport) && m.match_key === key
                ) || {};

                return (
                  <div key={key} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3.5 shadow-xl">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="font-extrabold text-amber-400 text-xs tracking-wider uppercase">{key}</span>
                      <span className="text-xxs text-slate-400 font-medium">{label}</span>
                    </div>

                    <div>
                      <label className="block text-xxs font-bold text-slate-400 uppercase mb-1">Team 1 Slot</label>
                      <select
                        value={match.team1_id || ''}
                        onChange={(e) => handleUpdateBracketMatch(key, e.target.value, match.team2_id, match.winner_id)}
                        className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-2.5 rounded-lg focus:border-amber-500 focus:outline-none"
                      >
                        <option value="">-- None / TBD --</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.team_name || t.name} ({t.sport})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xxs font-bold text-slate-400 uppercase mb-1">Team 2 Slot</label>
                      <select
                        value={match.team2_id || ''}
                        onChange={(e) => handleUpdateBracketMatch(key, match.team1_id, e.target.value, match.winner_id)}
                        className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-2.5 rounded-lg focus:border-amber-500 focus:outline-none"
                      >
                        <option value="">-- None / TBD --</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.team_name || t.name} ({t.sport})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80">
                      <label className="block text-xxs font-black text-emerald-400 uppercase mb-1">
                        Declare Round Winner 🏆
                      </label>
                      <select
                        value={match.winner_id || ''}
                        onChange={(e) => handleUpdateBracketMatch(key, match.team1_id, match.team2_id, e.target.value)}
                        className="w-full bg-emerald-950/80 border border-emerald-500/80 text-emerald-200 text-xs font-bold p-2.5 rounded-lg focus:outline-none"
                      >
                        <option value="">-- Match In Progress (No Winner) --</option>
                        {match.team1_id && (
                          <option value={match.team1_id}>
                            🏆 WINNER: {teams.find((t) => t.id === match.team1_id)?.team_name || 'Team 1'}
                          </option>
                        )}
                        {match.team2_id && (
                          <option value={match.team2_id}>
                            🏆 WINNER: {teams.find((t) => t.id === match.team2_id)?.team_name || 'Team 2'}
                          </option>
                        )}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: TEAMS MANAGEMENT & QUICK SPORTS CONTROL */}
        {activeTab === 'teams' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
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
                      {sportsList.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.emoji} {s.name}
                        </option>
                      ))}
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

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
                <h2 className="text-xl font-bold text-white">⚽ Manage Sports Database</h2>
                <form onSubmit={handleAddSport} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Emoji"
                    value={newSportEmoji}
                    onChange={(e) => setNewSportEmoji(e.target.value)}
                    className="w-16 bg-slate-950 border border-slate-800 rounded px-2 text-sm text-center"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Sport (e.g. Swimming)"
                    value={newSportName}
                    onChange={(e) => setNewSportName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 text-sm text-white"
                  />
                  <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 rounded text-xs whitespace-nowrap">
                    + Add
                  </button>
                </form>

                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {sportsList.map((s) => (
                    <div key={s.id} className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800 text-xs">
                      <span className="font-bold text-white">{s.emoji} {s.name}</span>
                      <button
                        onClick={() => handleDeleteSport(s.id, s.name)}
                        className="text-rose-400 hover:underline"
                      >
                        Delete 🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
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

        {/* TAB 4: COMPETITIONS */}
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
                    {sportsList.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.emoji} {s.name}
                      </option>
                    ))}
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
              <h2 className="text-xl font-bold text-white mb-4">Competitions List ({competitions.length})</h2>
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
                    {competitions.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-4 text-center text-slate-500">No competitions created yet.</td>
                      </tr>
                    ) : (
                      competitions.map((comp) => (
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DONATIONS & EQUIPMENT FUNDRAISING GOALS */}
        {activeTab === 'donations' && (
          <div className="space-y-8">
            {pendingDonationRequests.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/40 p-5 rounded-2xl space-y-3">
                <h2 className="font-bold text-amber-300 text-base flex items-center gap-2">
                  <span>📩</span> Student Donation Proofs Pending Approval ({pendingDonationRequests.length})
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="p-3">Student</th>
                        <th className="p-3">Target Item</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Sender Phone</th>
                        <th className="p-3">Tx ID / Ref</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingDonationRequests.map((don) => (
                        <tr key={don.id} className="border-b border-slate-800/50">
                          <td className="p-3 font-bold text-white">{don.profiles?.full_name || don.donor_name}</td>
                          <td className="p-3 text-slate-300">{don.fundraising?.item_name || 'General Equipment'}</td>
                          <td className="p-3 font-bold text-emerald-400">{don.amount} EGP</td>
                          <td className="p-3 text-slate-300">{don.sender_phone || 'N/A'}</td>
                          <td className="p-3 font-mono text-cyan-300">{don.transaction_id || don.reference_number || 'N/A'}</td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => handleApproveStudentDonation(don, true)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded text-xs transition"
                            >
                              Approve ✅
                            </button>
                            <button
                              onClick={() => handleApproveStudentDonation(don, false)}
                              className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1 rounded text-xs transition"
                            >
                              Reject ❌
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl h-fit">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">
                    {editingFundId ? '✏️ Edit Campaign Goal' : '📢 Create Equipment Goal'}
                  </h2>
                  {editingFundId && (
                    <button
                      onClick={resetFundForm}
                      className="text-xs text-amber-400 hover:underline"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveFundraising} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Equipment / Campaign Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Volleyball Nets & Balls"
                      value={fundItemName}
                      onChange={(e) => setFundItemName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Target Goal (EGP)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 2000"
                        value={fundTargetAmount}
                        onChange={(e) => setFundTargetAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Raised So Far (EGP)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 500"
                        value={fundRaisedAmount}
                        onChange={(e) => setFundRaisedAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Description</label>
                    <textarea
                      rows={3}
                      placeholder="Explain what the sports equipment will be used for..."
                      value={fundDescription}
                      onChange={(e) => setFundDescription(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full py-2.5 font-semibold rounded-lg text-sm transition ${
                      editingFundId ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {editingFundId ? 'Save Campaign Changes' : '+ Publish Equipment Goal'}
                  </button>

                  {fundActionMsg && (
                    <p className={`text-xs ${fundActionMsg.startsWith('Success') ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {fundActionMsg}
                    </p>
                  )}
                </form>
              </div>

              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                <h2 className="text-xl font-bold text-white mb-4">
                  📢 Active Equipment Campaigns ({fundraising.length})
                </h2>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {fundraising.length === 0 ? (
                    <p className="text-xs text-slate-500">No equipment goals created yet.</p>
                  ) : (
                    fundraising.map((item) => {
                      const target = item.target_amount || 0;
                      const raised = item.raised_amount || 0;
                      const percent = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;

                      return (
                        <div key={item.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div>
                              <h3 className="font-bold text-white text-base">{item.item_name}</h3>
                              <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEditingFund(item)}
                                className="px-3 py-1 bg-amber-600/30 hover:bg-amber-600 text-amber-300 hover:text-white text-xs font-bold rounded transition border border-amber-500/40"
                              >
                                Edit ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteFundraising(item.id, item.item_name)}
                                className="px-3 py-1 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold rounded transition border border-rose-500/40"
                              >
                                Delete 🗑️
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800">
                              <div
                                className="bg-emerald-500 h-full transition-all duration-300"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-slate-300 font-medium pt-1">
                              <span>Raised: <strong className="text-emerald-400">{raised} EGP</strong></span>
                              <span>Goal: <strong className="text-white">{target} EGP</strong> ({percent}%)</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-900 text-xs">
                            <span className="text-slate-500 font-semibold text-xxs uppercase">Quick Adjust Progress:</span>
                            <button
                              onClick={() => handleQuickUpdateProgress(item.id, target, raised, 100)}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded text-xxs font-bold"
                            >
                              +100 EGP
                            </button>
                            <button
                              onClick={() => handleQuickUpdateProgress(item.id, target, raised, 500)}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded text-xxs font-bold"
                            >
                              +500 EGP
                            </button>
                            <button
                              onClick={() => handleQuickUpdateProgress(item.id, target, target, 0)}
                              className="px-2 py-0.5 bg-emerald-900/40 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600 hover:text-white rounded text-xxs font-bold ml-auto"
                            >
                              Mark 100% Completed ✨
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl h-fit">
                <h2 className="text-xl font-bold text-white mb-4">💳 Record Manual Donation</h2>
                <form onSubmit={handleAddDonation} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Donor Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Captain Ahmed"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Link to Goal (Optional)</label>
                    <select
                      value={selectedFundIdForDonation}
                      onChange={(e) => setSelectedFundIdForDonation(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm"
                    >
                      <option value="">General Equipment Fund</option>
                      {fundraising.map((f) => (
                        <option key={f.id} value={f.id}>{f.item_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Amount (EGP)</label>
                    <input
                      type="number"
                      required
                      min="1"
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
                      <option>Vodafone Cash</option>
                      <option>InstaPay</option>
                      <option>Cash</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Reference Number / Note</label>
                    <input
                      type="text"
                      placeholder="e.g. TXN12345"
                      value={refNumber}
                      onChange={(e) => setRefNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-sm transition"
                  >
                    Record & Add To Campaign
                  </button>

                  {donationMsg && (
                    <p className={`text-xs ${donationMsg.startsWith('Success') ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {donationMsg}
                    </p>
                  )}
                </form>
              </div>

              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                <h2 className="text-xl font-bold text-white mb-4">📖 Complete Donation Ledger</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase">
                        <th className="py-3 px-4">Donor / Student</th>
                        <th className="py-3 px-4">Target Campaign</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                      {donations.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-4 text-center text-slate-500">No donations recorded yet.</td>
                        </tr>
                      ) : (
                        donations.map((d) => (
                          <tr key={d.id} className="hover:bg-slate-800/50 transition">
                            <td className="py-3 px-4 font-medium text-white">
                              {d.profiles?.full_name || d.donor_name || 'Anonymous'}
                            </td>
                            <td className="py-3 px-4 text-slate-300 text-xs">
                              {d.fundraising?.item_name || 'General'}
                            </td>
                            <td className="py-3 px-4 font-bold text-emerald-400">{d.amount} EGP</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded uppercase ${
                                d.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                                d.status === 'rejected' ? 'bg-rose-500/20 text-rose-400' :
                                'bg-amber-500/20 text-amber-400'
                              }`}>
                                {d.status || 'approved'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeleteDonation(d.id)}
                                className="text-rose-400 hover:text-rose-300 text-xs hover:underline"
                              >
                                Delete 🗑️
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
