'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://agmumcfifdxwcydzpgqr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_5K3yRDYl2-OxwO78i2mk0A_GV4tDBGl";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function Home() {
  const [fundraising, setFundraising] = useState([]);
  const [matches, setMatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [userDonations, setUserDonations] = useState([]);

  // Active Logged-in / Registered Student
  const [currentStudent, setCurrentStudent] = useState(null);

  // Registration Form States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Male');
  const [grade, setGrade] = useState('G10');
  const [className, setClassName] = useState('1A');

  // Match Form States
  const [challengerTeam, setChallengerTeam] = useState('');
  const [opponentTeam, setOpponentTeam] = useState('');
  const [sport, setSport] = useState('Football');
  const [matchDateTime, setMatchDateTime] = useState('');

  // Team Form States
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSport, setNewTeamSport] = useState('Football');

  // Update available classes based on Grade and Gender rule
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

    if (fundData) setFundraising(fundData);
    if (matchData) setMatches(matchData);
    if (profData) setStudents(profData);
    if (teamData) setTeams(teamData);

    if (currentStudent) {
      const { data: donData } = await supabase
        .from('donations')
        .select('*, fundraising(item_name)')
        .eq('student_id', currentStudent.id);
      if (donData) setUserDonations(donData);
    }
  }

  // Handle Registration / Login Validation
  async function handleRegister(e) {
    e.preventDefault();

    if (!fullName.trim()) return alert('Please enter your full name.');

    // School Email Validation
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@stemalex.moe.edu.eg')) {
      return alert('Invalid email! School email must end with @stemalex.moe.edu.eg');
    }

    // Class / Gender Strict Validation Rule
    const classLetter = className.slice(-1).toUpperCase();
    if (gender === 'Male' && !['A', 'B', 'C'].includes(classLetter)) {
      return alert('Error: Classes A, B, and C are reserved for Male students only.');
    }
    if (gender === 'Female' && !['D', 'E', 'F'].includes(classLetter)) {
      return alert('Error: Classes D, E, and F are reserved for Female students only.');
    }

    // Check if profile already exists by email
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    if (existing) {
      setCurrentStudent(existing);
      alert(`Welcome back, ${existing.full_name}! You are logged in.`);
      return;
    }

    const newId = crypto.randomUUID();
    const newProfile = {
      id: newId,
      full_name: fullName,
      email: cleanEmail,
      gender,
      grade,
      class_name: className,
      points: 10,
    };

    const { error } = await supabase.from('profiles').insert([newProfile]);

    if (error) {
      alert('Registration failed: ' + error.message);
    } else {
      setCurrentStudent(newProfile);
      alert('Account registered successfully! You earned 10 welcome points 🏆');
      setFullName('');
      setEmail('');
      fetchData();
    }
  }

  // Account Deletion Feature
  async function handleDeleteAccount() {
    if (!currentStudent) return;
    const confirmDelete = confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    if (!confirmDelete) return;

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', currentStudent.id);

    if (error) {
      alert('Failed to delete account: ' + error.message);
    } else {
      alert('Your account has been deleted successfully.');
      setCurrentStudent(null);
      setUserDonations([]);
      fetchData();
    }
  }

  // Team Creation
  async function handleCreateTeam(e) {
    e.preventDefault();
    if (!currentStudent) return alert('Please register or log in first.');
    if (!newTeamName.trim()) return alert('Please enter a team name.');

    const { error } = await supabase.from('teams').insert([
      {
        team_name: newTeamName,
        sport: newTeamSport,
        captain_id: currentStudent.id,
      },
    ]);

    if (error) {
      alert('Error creating team: ' + error.message);
    } else {
      alert(`Team "${newTeamName}" created successfully!`);
      setNewTeamName('');
      fetchData();
    }
  }

  // Equipment Donation
  async function handleDonate(itemId, currentAmount) {
    if (!currentStudent) return alert('Please register or log in to make a donation.');

    const amount = prompt('Enter donation amount in EGP:');
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;

    const numAmount = Number(amount);
    const newTotal = Number(currentAmount) + numAmount;

    const { error: updateError } = await supabase
      .from('fundraising')
      .update({ raised_amount: newTotal })
      .eq('id', itemId);

    if (!updateError) {
      await supabase.from('donations').insert([
        {
          student_id: currentStudent.id,
          item_id: itemId,
          amount: numAmount,
        },
      ]);
      alert('Thank you for contributing to STEM sports equipment!');
      fetchData();
    }
  }

  // Friendly Match Challenge
  async function handleCreateMatch(e) {
    e.preventDefault();
    if (!challengerTeam || !opponentTeam || !matchDateTime) {
      return alert('Please fill in all match challenge details.');
    }

    const { error } = await supabase.from('matches').insert([
      {
        sport,
        match_date: matchDateTime.split('T')[0],
        match_time: matchDateTime,
        status: 'pending',
      },
    ]);

    if (error) {
      alert('Error creating match challenge: ' + error.message);
    } else {
      alert('Friendly Match Challenge submitted! Status set to Pending.');
      setChallengerTeam('');
      setOpponentTeam('');
      setMatchDateTime('');
      fetchData();
    }
  }

  // Gender-based dynamic theme styling
  const isFemale = currentStudent?.gender === 'Female';

  const themeClasses = isFemale
    ? {
        headerBg: 'from-pink-900 via-rose-900 to-pink-950 border-pink-700/50',
        badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
        accentText: 'text-pink-400',
        cardBg: 'bg-slate-900/90 border-pink-900/40',
        buttonBg: 'bg-pink-600 hover:bg-pink-500',
        border: 'border-pink-800/50',
      }
    : {
        headerBg: 'from-blue-950 via-indigo-900 to-slate-900 border-blue-700/50',
        badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        accentText: 'text-cyan-400',
        cardBg: 'bg-slate-900/90 border-blue-900/40',
        buttonBg: 'bg-blue-600 hover:bg-blue-500',
        border: 'border-blue-800/50',
      };

  // Helper for available class options
  const classPrefix = grade === 'G10' ? '1' : grade === 'G11' ? '2' : '3';
  const availableClasses =
    gender === 'Male'
      ? [`${classPrefix}A`, `${classPrefix}B`, `${classPrefix}C`]
      : [`${classPrefix}D`, `${classPrefix}E`, `${classPrefix}F`];

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

      {/* Student Dashboard (When Logged In) */}
      {currentStudent && (
        <section className={`p-6 rounded-2xl border shadow-xl ${themeClasses.cardBg}`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-700 pb-4 mb-6 gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400">Student Dashboard</span>
              <h2 className={`text-2xl font-bold ${themeClasses.accentText}`}>
                Welcome, {currentStudent.full_name} ({currentStudent.gender})
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-lg font-bold text-sm">
                ⭐ {currentStudent.points} Points
              </span>
              <button
                onClick={handleDeleteAccount}
                className="bg-red-600/80 hover:bg-red-600 text-white text-xs px-3 py-2 rounded-lg transition"
              >
                Delete Account
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-sm">
            {/* Personal Info */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <h3 className="font-bold text-slate-300 border-b border-slate-800 pb-2">Personal Information</h3>
              <p><span className="text-slate-400">Email:</span> {currentStudent.email}</p>
              <p><span className="text-slate-400">Grade:</span> {currentStudent.grade}</p>
              <p><span className="text-slate-400">Class:</span> {currentStudent.class_name}</p>
              <p><span className="text-slate-400">Gender:</span> {currentStudent.gender}</p>
            </div>

            {/* Team Manager */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-slate-300 border-b border-slate-800 pb-2">My Team Manager</h3>
              <form onSubmit={handleCreateTeam} className="space-y-2">
                <input
                  type="text"
                  placeholder="Team Name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white"
                />
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
                <button className={`w-full text-xs font-bold py-2 rounded transition ${themeClasses.buttonBg}`}>
                  Create Team
                </button>
              </form>
            </div>

            {/* My Donations */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <h3 className="font-bold text-slate-300 border-b border-slate-800 pb-2">My Contributions</h3>
              {userDonations.length === 0 ? (
                <p className="text-xs text-slate-500">No equipment donations logged yet.</p>
              ) : (
                <ul className="space-y-1 text-xs max-h-32 overflow-y-auto">
                  {userDonations.map((don) => (
                    <li key={don.id} className="flex justify-between text-slate-300">
                      <span>{don.fundraising?.item_name || 'Equipment'}</span>
                      <span className="font-bold text-emerald-400">{don.amount} EGP</span>
                    </li>
                  ))}
                </ul>
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
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
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
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
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
                {availableClasses.map((c) => (
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

      {/* STEM Sports Class Leaderboard */}
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
                  <td colSpan="5" className="p-4 text-center text-slate-500">
                    No student registered yet. Be the first to join!
                  </td>
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

      {/* Crowdfunding Equipment Progress */}
      <section className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800">
        <h2 className="text-2xl font-bold mb-1 text-emerald-400 flex items-center gap-2">
          <span>💰</span> Equipment Crowdfunding Tracker
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Transparent student-driven funding for new gym equipment and court repairs.
        </p>

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
              <label className="block text-xs text-slate-300 mb-1">Challenger Team</label>
              <input
                type="text"
                placeholder="Your Team Name"
                value={challengerTeam}
                onChange={(e) => setChallengerTeam(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Opponent Team</label>
              <input
                type="text"
                placeholder="Opponent Team Name"
                value={opponentTeam}
                onChange={(e) => setOpponentTeam(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Sport</label>
                <select
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
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
                <label className="block text-xs text-slate-300 mb-1">Exact Date & Hour</label>
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
              matches.map((match) => (
                <div key={match.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-white block">{match.sport} Match</span>
                    <span className="text-slate-400">Date/Time: {match.match_time ? new Date(match.match_time).toLocaleString() : match.match_date}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full font-bold uppercase ${
                    match.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    match.status === 'denied' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {match.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
