'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://agmumcfifdxwcydzpgqr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_5K3yRDYl2-OxwO78i2mk0A_GV4tDBGl";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LOGO_PRESETS = ['🛡️', '⚡', '🦅', '🦁', '🔥', '👑', '🐉', '⚔️', '⚽', '🏀', '🏐', '♟️'];
const MAX_FILE_SIZE_MB = 2; // Strict 2MB size limit to preserve storage

// Helper component to render Image Logo or Emoji
function TeamLogo({ logo, sizeClass = "w-6 h-6 text-base" }) {
  if (logo && (logo.startsWith('http://') || logo.startsWith('https://'))) {
    return (
      <img
        src={logo}
        alt="Team Logo"
        className={`${sizeClass} object-cover rounded-full inline-block align-middle border border-slate-700 bg-slate-900`}
      />
    );
  }
  return <span className="inline-block align-middle mr-1">{logo || '🛡️'}</span>;
}

export default function Home() {
  const [fundraising, setFundraising] = useState([]);
  const [matches, setMatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [userDonations, setUserDonations] = useState([]);

  // Active Student Session
  const [currentStudent, setCurrentStudent] = useState(null);

  // Registration States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Male');
  const [grade, setGrade] = useState('G10');
  const [className, setClassName] = useState('1A');

  // Team Form States
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSport, setNewTeamSport] = useState('Football');
  const [newTeamLogo, setNewTeamLogo] = useState('🛡️');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState('');

  // Match Challenge States
  const [challengerTeamId, setChallengerTeamId] = useState('');
  const [opponentTeamId, setOpponentTeamId] = useState('');
  const [matchSport, setMatchSport] = useState('Football');
  const [matchDateTime, setMatchDateTime] = useState('');

  // 1. Restore Student Session automatically on page refresh
  useEffect(() => {
    async function restoreSession() {
      const savedEmail = localStorage.getItem('stem_student_email');
      if (savedEmail) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', savedEmail)
          .single();

        if (profile) {
          setCurrentStudent(profile);
        }
      }
    }
    restoreSession();
  }, []);

  // Update class options based on grade & gender rules
  useEffect(() => {
    const prefix = grade === 'G10' ? '1' : grade === 'G11' ? '2' : '3';
    if (gender === 'Male') {
      setClassName(`${prefix}A`);
    } else {
      setClassName(`${prefix}D`);
    }
  }, [gender, grade]);

  useEffect(() => {
    fetchData();
  }, [currentStudent]);

  async function fetchData() {
    const { data: fundData } = await supabase.from('fundraising').select('*');
    const { data: matchData } = await supabase.from('matches').select('*');
    const { data: profData } = await supabase.from('profiles').select('*');
    const { data: teamData } = await supabase.from('teams').select('*');
    const { data: tmData } = await supabase.from('team_members').select('*');

    if (fundData) setFundraising(fundData);
    if (matchData) setMatches(matchData);
    if (profData) setStudents(profData);
    if (teamData) setTeams(teamData);
    if (tmData) setTeamMembers(tmData);

    if (currentStudent) {
      const { data: donData } = await supabase
        .from('donations')
        .select('*, fundraising(item_name)')
        .eq('student_id', currentStudent.id);
      if (donData) setUserDonations(donData);
    }
  }

  // Handle Custom Image Upload with 2MB limit
  async function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return alert('Please select a valid image file (PNG, JPG, WebP).');
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return alert(`File is too large (${(file.size / (1024 * 1024)).toFixed(2)} MB). Max limit is ${MAX_FILE_SIZE_MB} MB.`);
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('team-logos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        alert('Upload failed: ' + uploadError.message);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('team-logos')
          .getPublicUrl(fileName);

        setNewTeamLogo(publicUrlData.publicUrl);
        alert('Custom logo uploaded successfully! 🖼️');
      }
    } catch (err) {
      alert('Upload error: ' + err.message);
    } finally {
      setUploadingLogo(false);
    }
  }

  // Register or Sign In Student & Save Session
  async function handleRegister(e) {
    e.preventDefault();
    if (!fullName.trim()) return alert('Please enter your full name.');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@stemalex.moe.edu.eg')) {
      return alert('Invalid email! Must end with @stemalex.moe.edu.eg');
    }

    const classLetter = className.slice(-1).toUpperCase();
    if (gender === 'Male' && !['A', 'B', 'C'].includes(classLetter)) {
      return alert('Error: Classes A, B, and C are reserved for Male students only.');
    }
    if (gender === 'Female' && !['D', 'E', 'F'].includes(classLetter)) {
      return alert('Error: Classes D, E, and F are reserved for Female students only.');
    }

    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    if (existing) {
      localStorage.setItem('stem_student_email', cleanEmail);
      setCurrentStudent(existing);
      alert(`Welcome back, ${existing.full_name}!`);
      return;
    }

    const newProfile = {
      full_name: fullName,
      email: cleanEmail,
      gender,
      grade,
      class_name: className,
      points: 10,
    };

    const { data, error } = await supabase.from('profiles').insert([newProfile]).select().single();

    if (error) {
      alert('Registration failed: ' + error.message);
    } else {
      localStorage.setItem('stem_student_email', cleanEmail);
      setCurrentStudent(data);
      alert('Account registered successfully! 🏆');
      setFullName('');
      setEmail('');
      fetchData();
    }
  }

  // Manual Sign Out
  function handleSignOut() {
    localStorage.removeItem('stem_student_email');
    setCurrentStudent(null);
    setUserDonations([]);
  }

  // Delete Student Account
  async function handleDeleteAccount() {
    if (!currentStudent) return;
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;

    const { error } = await supabase.from('profiles').delete().eq('id', currentStudent.id);
    if (error) {
      alert('Failed to delete account: ' + error.message);
    } else {
      localStorage.removeItem('stem_student_email');
      alert('Your account has been deleted.');
      setCurrentStudent(null);
      setUserDonations([]);
      fetchData();
    }
  }

  // Create or Edit Team
  async function handleSaveTeam(e) {
    e.preventDefault();
    if (!currentStudent) return alert('Please log in first.');
    if (!newTeamName.trim()) return alert('Please enter a team name.');

    if (editingTeamId) {
      const { error } = await supabase
        .from('teams')
        .update({ team_name: newTeamName, sport: newTeamSport, logo_url: newTeamLogo })
        .eq('id', editingTeamId);

      if (error) alert('Error updating team: ' + error.message);
      else {
        alert('Team updated successfully!');
        setEditingTeamId(null);
      }
    } else {
      const { data: createdTeam, error } = await supabase
        .from('teams')
        .insert([
          {
            team_name: newTeamName,
            sport: newTeamSport,
            logo_url: newTeamLogo,
            captain_id: currentStudent.id,
          },
        ])
        .select()
        .single();

      if (error) {
        alert('Error creating team: ' + error.message);
      } else {
        await supabase.from('team_members').insert([
          { team_id: createdTeam.id, student_id: currentStudent.id, role: 'Captain' },
        ]);
        alert(`Clan/Team "${newTeamName}" created successfully!`);
      }
    }

    setNewTeamName('');
    setNewTeamLogo('🛡️');
    fetchData();
  }

  // Delete Team
  async function handleDeleteTeam(teamId) {
    if (!confirm('Are you sure you want to delete this team/clan?')) return;
    const { error } = await supabase.from('teams').delete().eq('id', teamId);
    if (error) alert('Delete failed: ' + error.message);
    else {
      alert('Team deleted.');
      fetchData();
    }
  }

  // Add Member to Clan Roster
  async function handleAddClanMember(teamId) {
    if (!selectedStudentToAdd) return alert('Please select a student to add.');

    const { error } = await supabase.from('team_members').insert([
      { team_id: teamId, student_id: selectedStudentToAdd, role: 'Member' },
    ]);

    if (error) {
      alert('Could not add member: ' + error.message);
    } else {
      alert('Clan member added successfully!');
      setSelectedStudentToAdd('');
      fetchData();
    }
  }

  // Remove Member from Clan
  async function handleRemoveClanMember(membershipId) {
    const { error } = await supabase.from('team_members').delete().eq('id', membershipId);
    if (error) alert('Could not remove member: ' + error.message);
    else {
      alert('Member removed from clan.');
      fetchData();
    }
  }

  // Send Match Challenge
  async function handleCreateMatch(e) {
    e.preventDefault();
    if (!challengerTeamId || !opponentTeamId || !matchDateTime) {
      return alert('Please select both teams and match date/time.');
    }
    if (challengerTeamId === opponentTeamId) {
      return alert('A team cannot challenge itself!');
    }

    const { error } = await supabase.from('matches').insert([
      {
        challenger_team_id: challengerTeamId,
        opponent_team_id: opponentTeamId,
        sport: matchSport,
        match_date: matchDateTime.split('T')[0],
        match_time: matchDateTime,
        status: 'pending',
      },
    ]);

    if (error) {
      alert('Error creating match challenge: ' + error.message);
    } else {
      alert('Friendly Match Challenge sent to Opponent Leader!');
      setChallengerTeamId('');
      setOpponentTeamId('');
      setMatchDateTime('');
      fetchData();
    }
  }

  // Accept or Deny Match Challenge
  async function handleMatchResponse(matchId, newStatus) {
    const { error } = await supabase
      .from('matches')
      .update({ status: newStatus })
      .eq('id', matchId);

    if (error) {
      alert('Status update failed: ' + error.message);
    } else {
      alert(`Match challenge ${newStatus}!`);
      fetchData();
    }
  }

  // Equipment Donation
  async function handleDonate(itemId, currentAmount) {
    if (!currentStudent) return alert('Please register/log in to donate.');

    const amount = prompt('Enter donation amount in EGP:');
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;

    const numAmount = Number(amount);
    const newTotal = Number(currentAmount) + numAmount;

    const { error } = await supabase
      .from('fundraising')
      .update({ raised_amount: newTotal })
      .eq('id', itemId);

    if (!error) {
      await supabase.from('donations').insert([
        { student_id: currentStudent.id, item_id: itemId, amount: numAmount },
      ]);
      alert('Thank you for contributing to STEM sports!');
      fetchData();
    }
  }

  // Theme Styling based on Gender
  const isFemale = currentStudent?.gender === 'Female';
  const themeClasses = isFemale
    ? {
        headerBg: 'from-pink-900 via-rose-900 to-pink-950 border-pink-700/50',
        badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
        accentText: 'text-pink-400',
        cardBg: 'bg-slate-900/90 border-pink-900/40',
        buttonBg: 'bg-pink-600 hover:bg-pink-500',
      }
    : {
        headerBg: 'from-blue-950 via-indigo-900 to-slate-900 border-blue-700/50',
        badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        accentText: 'text-cyan-400',
        cardBg: 'bg-slate-900/90 border-blue-900/40',
        buttonBg: 'bg-blue-600 hover:bg-blue-500',
      };

  const myTeams = teams.filter((t) => t.captain_id === currentStudent?.id);
  const myTeamIds = myTeams.map((t) => t.id);
  const incomingChallenges = matches.filter(
    (m) => myTeamIds.includes(m.opponent_team_id) && m.status === 'pending'
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-10 font-sans text-slate-100">
      {/* Header Banner */}
      <header className={`text-center bg-gradient-to-r ${themeClasses.headerBg} p-8 rounded-3xl border shadow-2xl`}>
        <span className={`px-4 py-1.5 rounded-full text-sm font-bold inline-block mb-3 border ${themeClasses.badge}`}>
          Ready To Be Our New Champion 🏆
        </span>
        <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight">STEM Sports Platform</h1>
        <p className="text-slate-300 text-sm md:text-base max-w-2xl mx-auto">
          Official Sports Committee Portal for STEM High School for Boys & Girls - Alexandria
        </p>
      </header>

      {/* Student Dashboard */}
      {currentStudent && (
        <section className={`p-6 rounded-2xl border shadow-xl ${themeClasses.cardBg}`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-700 pb-4 mb-6 gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400">Student & Team Leader Dashboard</span>
              <h2 className={`text-2xl font-bold ${themeClasses.accentText}`}>
                Welcome, {currentStudent.full_name} ({currentStudent.gender})
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-lg font-bold text-sm">
                ⭐ {currentStudent.points} Points
              </span>
              <button
                onClick={handleSignOut}
                className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-2 rounded-lg transition"
              >
                Sign Out
              </button>
              <button
                onClick={handleDeleteAccount}
                className="bg-red-600/80 hover:bg-red-600 text-white text-xs px-3 py-2 rounded-lg transition"
              >
                Delete Account
              </button>
            </div>
          </div>

          {/* Incoming Match Challenges Alert */}
          {incomingChallenges.length > 0 && (
            <div className="mb-6 bg-amber-500/10 border border-amber-500/40 p-4 rounded-xl space-y-3">
              <h3 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                <span>⚠️</span> Incoming Friendly Match Requests!
              </h3>
              {incomingChallenges.map((match) => {
                const challengerTeam = teams.find((t) => t.id === match.challenger_team_id);
                const opponentTeam = teams.find((t) => t.id === match.opponent_team_id);
                return (
                  <div key={match.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-xs">
                    <div>
                      <span className="font-bold text-white">
                        <TeamLogo logo={challengerTeam?.logo_url} /> {challengerTeam?.team_name}
                      </span> challenged your team <span className="font-bold text-cyan-400">{opponentTeam?.team_name}</span> in <span className="underline">{match.sport}</span>
                      <p className="text-slate-400 text-xxs mt-0.5">Date: {new Date(match.match_time).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMatchResponse(match.id, 'approved')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded transition"
                      >
                        Accept Challenge
                      </button>
                      <button
                        onClick={() => handleMatchResponse(match.id, 'denied')}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded transition"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6 text-sm">
            {/* Clan / Team Creator & Editor */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-slate-300 border-b border-slate-800 pb-2">
                {editingTeamId ? 'Edit Team / Clan' : 'Create New Team / Clan'}
              </h3>
              <form onSubmit={handleSaveTeam} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Team Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Alex STEM Dragons"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs text-slate-400">Team Logo (Preset or Custom Upload)</label>
                  <div className="flex items-center gap-3 bg-slate-900 p-2.5 rounded border border-slate-800">
                    <div className="flex-shrink-0 text-center">
                      <span className="text-xxs text-slate-400 block mb-1">Preview</span>
                      <TeamLogo logo={newTeamLogo} sizeClass="w-10 h-10 text-2xl" />
                    </div>

                    <div className="w-full space-y-2">
                      <select
                        value={newTeamLogo.startsWith('http') ? 'custom' : newTeamLogo}
                        onChange={(e) => {
                          if (e.target.value !== 'custom') setNewTeamLogo(e.target.value);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white"
                      >
                        <optgroup label="Emoji Presets">
                          {LOGO_PRESETS.map((logo) => (
                            <option key={logo} value={logo}>{logo} Preset Logo</option>
                          ))}
                        </optgroup>
                        {newTeamLogo.startsWith('http') && (
                          <option value="custom">🖼️ Uploaded Custom Logo</option>
                        )}
                      </select>

                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                          className="text-xxs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xxs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                        />
                        <span className="text-xxs text-slate-500 block mt-0.5">
                          {uploadingLogo ? 'Uploading...' : `Max limit: ${MAX_FILE_SIZE_MB}MB`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Primary Sport</label>
                  <select
                    value={newTeamSport}
                    onChange={(e) => setNewTeamSport(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white"
                  >
                    <option>Football</option>
                    <option>Volleyball</option>
                    <option>Basketball</option>
                    <option>Table Tennis</option>
                    <option>Chess</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    disabled={uploadingLogo}
                    className={`w-full text-xs font-bold py-2 rounded transition ${themeClasses.buttonBg}`}
                  >
                    {editingTeamId ? 'Save Changes' : 'Create Team'}
                  </button>
                  {editingTeamId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTeamId(null);
                        setNewTeamName('');
                        setNewTeamLogo('🛡️');
                      }}
                      className="bg-slate-700 text-xs px-3 rounded"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* My Created Teams & Roster Control */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-slate-300 border-b border-slate-800 pb-2">My Created Teams & Clan Members</h3>
              {myTeams.length === 0 ? (
                <p className="text-xs text-slate-500">You haven't created any teams yet.</p>
              ) : (
                <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                  {myTeams.map((team) => {
                    const members = teamMembers.filter((tm) => tm.team_id === team.id);
                    return (
                      <div key={team.id} className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white text-sm flex items-center gap-1.5">
                            <TeamLogo logo={team.logo_url} /> {team.team_name} <span className="text-xxs font-normal text-slate-400">({team.sport})</span>
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingTeamId(team.id);
                                setNewTeamName(team.team_name);
                                setNewTeamSport(team.sport);
                                setNewTeamLogo(team.logo_url || '🛡️');
                              }}
                              className="bg-blue-600/40 hover:bg-blue-600 text-white px-2 py-0.5 rounded text-xxs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTeam(team.id)}
                              className="bg-red-600/40 hover:bg-red-600 text-white px-2 py-0.5 rounded text-xxs"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        <div className="bg-slate-950 p-2 rounded border border-slate-800">
                          <span className="text-xxs font-bold text-slate-400 uppercase block mb-1">Clan Roster:</span>
                          {members.length === 0 ? (
                            <p className="text-xxs text-slate-500">No members added yet.</p>
                          ) : (
                            <ul className="space-y-1">
                              {members.map((m) => {
                                const prof = students.find((s) => s.id === m.student_id);
                                return (
                                  <li key={m.id} className="flex justify-between items-center text-xxs">
                                    <span>👤 {prof?.full_name || 'Student'} ({prof?.class_name}) - <span className="text-amber-400">{m.role}</span></span>
                                    {m.student_id !== currentStudent.id && (
                                      <button
                                        onClick={() => handleRemoveClanMember(m.id)}
                                        className="text-red-400 hover:underline"
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          )}

                          <div className="mt-2 flex gap-1">
                            <select
                              value={selectedStudentToAdd}
                              onChange={(e) => setSelectedStudentToAdd(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded text-xxs p-1 text-white"
                            >
                              <option value="">Select Student to Add...</option>
                              {students
                                .filter((s) => s.id !== currentStudent.id)
                                .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.full_name} ({s.class_name})
                                  </option>
                                ))}
                            </select>
                            <button
                              onClick={() => handleAddClanMember(team.id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xxs px-2 rounded font-bold"
                            >
                              + Add
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Account Registration / Login Section */}
      {!currentStudent && (
        <section className={`p-6 rounded-2xl border shadow-xl ${themeClasses.cardBg}`}>
          <h2 className={`text-2xl font-bold mb-2 ${themeClasses.accentText}`}>Student Account Registration</h2>
          <p className="text-xs text-slate-400 mb-6">Enter your details to create your profile and access tournaments.</p>

          <form onSubmit={handleRegister} className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Philopateer Gerges"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">School Email (@stemalex.moe.edu.eg)</label>
              <input
                type="email"
                required
                placeholder="student@stemalex.moe.edu.eg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
              >
                <option value="Male">Male (Blue Theme)</option>
                <option value="Female">Female (Pink Theme)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Grade</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
              >
                <option value="G10">Grade 10</option>
                <option value="G11">Grade 11</option>
                <option value="G12">Grade 12</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-slate-300 mb-1">
                Class Section ({gender === 'Male' ? 'A, B, C for Boys' : 'D, E, F for Girls'})
              </label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
              >
                {(gender === 'Male'
                  ? [`${grade === 'G10' ? '1' : grade === 'G11' ? '2' : '3'}A`, `${grade === 'G10' ? '1' : grade === 'G11' ? '2' : '3'}B`, `${grade === 'G10' ? '1' : grade === 'G11' ? '2' : '3'}C`]
                  : [`${grade === 'G10' ? '1' : grade === 'G11' ? '2' : '3'}D`, `${grade === 'G10' ? '1' : grade === 'G11' ? '2' : '3'}E`, `${grade === 'G10' ? '1' : grade === 'G11' ? '2' : '3'}F`]
                ).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <button className={`md:col-span-2 mt-2 font-bold py-3 rounded-lg transition ${themeClasses.buttonBg}`}>
              Register / Sign In
            </button>
          </form>
        </section>
      )}

      {/* Class Standings */}
      <section className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-amber-400">
          <span>🥇</span> Class Standings & Points (STEM SPORTS CLASS)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs">
                <th className="p-3">Student Name</th>
                <th className="p-3">Grade</th>
                <th className="p-3">Class</th>
                <th className="p-3">Gender</th>
                <th className="p-3">Points</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-slate-500">No students registered yet.</td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="p-3 font-semibold text-white">{student.full_name}</td>
                    <td className="p-3 text-slate-400">{student.grade || 'N/A'}</td>
                    <td className="p-3 text-slate-300 font-bold">{student.class_name}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${student.gender === 'Female' ? 'bg-pink-500/20 text-pink-300' : 'bg-blue-500/20 text-blue-300'}`}>
                        {student.gender || 'Male'}
                      </span>
                    </td>
                    <td className="p-3 text-amber-400 font-bold">{student.points} pts</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Equipment Crowdfunding */}
      <section className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800">
        <h2 className="text-2xl font-bold mb-1 text-emerald-400 flex items-center gap-2">
          <span>💰</span> Equipment Crowdfunding Tracker
        </h2>
        <p className="text-xs text-slate-400 mb-6">Transparent student-driven funding for new equipment.</p>

        <div className="grid md:grid-cols-3 gap-6">
          {fundraising.map((item) => {
            const percent = Math.min(100, Math.round((item.raised_amount / item.target_amount) * 100));
            return (
              <div key={item.id} className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base mb-1 text-white">{item.item_name}</h3>
                  <p className="text-xs text-slate-400 mb-4">{item.description}</p>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2">
                    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mb-4">
                    <span>Raised: {item.raised_amount} EGP</span>
                    <span>Goal: {item.target_amount} EGP ({percent}%)</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDonate(item.id, item.raised_amount)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs transition"
                >
                  + Contribute / Donate
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Match Challenge & Statuses */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Challenge Form */}
        <section className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800">
          <h2 className="text-xl font-bold mb-4 text-purple-400">⚔️ Challenge Friendly Match</h2>
          <form onSubmit={handleCreateMatch} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Select Your Team (Challenger)</label>
              <select
                value={challengerTeamId}
                onChange={(e) => setChallengerTeamId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
              >
                <option value="">Select your team...</option>
                {myTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.logo_url?.startsWith('http') ? '🖼️' : t.logo_url} {t.team_name} ({t.sport})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Select Opponent Team</label>
              <select
                value={opponentTeamId}
                onChange={(e) => setOpponentTeamId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
              >
                <option value="">Select opponent team...</option>
                {teams
                  .filter((t) => t.captain_id !== currentStudent?.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.logo_url?.startsWith('http') ? '🖼️' : t.logo_url} {t.team_name} ({t.sport})
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Sport</label>
                <select
                  value={matchSport}
                  onChange={(e) => setMatchSport(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  <option>Football</option>
                  <option>Volleyball</option>
                  <option>Basketball</option>
                  <option>Chess</option>
                  <option>Table Tennis</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Date & Exact Hour</label>
                <input
                  type="datetime-local"
                  value={matchDateTime}
                  onChange={(e) => setMatchDateTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs"
                />
              </div>
            </div>

            <button className="w-full bg-purple-600 hover:bg-purple-500 font-bold py-2.5 rounded-lg transition">
              Send Match Challenge
            </button>
          </form>
        </section>

        {/* Scheduled Matches List */}
        <section className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800">
          <h2 className="text-xl font-bold mb-4 text-indigo-400">📅 Match Schedule & Status</h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {matches.length === 0 ? (
              <p className="text-xs text-slate-500">No match challenges scheduled yet.</p>
            ) : (
              matches.map((match) => {
                const chalTeam = teams.find((t) => t.id === match.challenger_team_id);
                const oppTeam = teams.find((t) => t.id === match.opponent_team_id);

                return (
                  <div key={match.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <TeamLogo logo={chalTeam?.logo_url} /> {chalTeam?.team_name || 'Challenger'}
                        <span className="text-slate-500 font-normal">vs</span>
                        <TeamLogo logo={oppTeam?.logo_url} /> {oppTeam?.team_name || 'Opponent'}
                      </span>
                      <span className="text-slate-400 block text-xxs mt-1">Sport: {match.sport}</span>
                      <span className="text-slate-400 block text-xxs">
                        Time: {match.match_time ? new Date(match.match_time).toLocaleString() : match.match_date}
                      </span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-xxs ${
                      match.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      match.status === 'denied' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {match.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
