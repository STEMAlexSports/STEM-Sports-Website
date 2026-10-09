'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://agmumcfifdxwcydzpgqr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnbXVtY2ZpZmR4d2N5ZHpwZ3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzODYzNjAsImV4cCI6MjEwNjk2MjM2MH0.ELpZRnnvULXqzteXCinGoZAY0Nrxau0-6qFb0vI2_iE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const VODAFONE_CASH_NUMBER = "010XXXXXXXX"; 
const INSTAPAY_ADDRESS = "yourname@instapay"; 

const LOGO_PRESETS = ['🛡️', '⚡', '🦅', '🦁', '🔥', '👑', '🐉', '⚔️', '⚽', '🏀', '🏐', '♟️'];
const MAX_FILE_SIZE_MB = 2;

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
  const [activeTab, setActiveTab] = useState('dashboard');

  const [fundraising, setFundraising] = useState([]);
  const [matches, setMatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [compParticipants, setCompParticipants] = useState([]);
  const [userDonations, setUserDonations] = useState([]);
  const [allDonations, setAllDonations] = useState([]);

  // Active Session
  const [currentStudent, setCurrentStudent] = useState(null);

  // Selected Competition View
  const [selectedCompId, setSelectedCompId] = useState(null);
  const [teamToRegisterId, setTeamToRegisterId] = useState('');

  // Auth Card Mode ('login' | 'register' | 'otp')
  const [authMode, setAuthMode] = useState('login');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Auth Input States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState('Male');
  const [grade, setGrade] = useState('G10');
  const [className, setClassName] = useState('1A');

  // Donation Payment Modal States
  const [donatingItem, setDonatingItem] = useState(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [submittingDonation, setSubmittingDonation] = useState(false);

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

  // Restore Session automatically
  useEffect(() => {
    async function restoreSession() {
      const savedEmail = localStorage.getItem('stem_student_email');
      if (savedEmail) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', savedEmail)
          .single();

        if (profile) setCurrentStudent(profile);
      }
    }
    restoreSession();
  }, []);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

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
    const { data: profData } = await supabase.from('profiles').select('*').order('points', { ascending: false });
    const { data: teamData } = await supabase.from('teams').select('*').order('points', { ascending: false });
    const { data: tmData } = await supabase.from('team_members').select('*');
    const { data: compData } = await supabase.from('competitions').select('*').order('created_at', { ascending: false });
    const { data: partData } = await supabase.from('competition_participants').select('*').order('score', { ascending: false });

    if (fundData) setFundraising(fundData);
    if (matchData) setMatches(matchData);
    if (profData) setStudents(profData);
    if (teamData) setTeams(teamData);
    if (tmData) setTeamMembers(tmData);
    if (compData) {
      setCompetitions(compData);
      if (!selectedCompId && compData.length > 0) {
        setSelectedCompId(compData[0].id);
      }
    }
    if (partData) setCompParticipants(partData);

    if (currentStudent) {
      const { data: donData } = await supabase
        .from('donations')
        .select('*, fundraising(item_name)')
        .eq('student_id', currentStudent.id);
      if (donData) setUserDonations(donData);

      if (currentStudent.is_admin) {
        const { data: allDon } = await supabase
          .from('donations')
          .select('*, fundraising(item_name), profiles(full_name, email)')
          .order('created_at', { ascending: false });
        if (allDon) setAllDonations(allDon);
      }
    }
  }

  // Custom Logo Upload
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

  // Sign In
  async function handleSignIn(e) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@stemalex.moe.edu.eg')) {
      return alert('Invalid email! Must end with @stemalex.moe.edu.eg');
    }
    if (!password) return alert('Please enter your password.');

    const { data: existing, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    if (error || !existing) {
      return alert('Account not found! Please check your email or Register a new account.');
    }

    if (existing.password && existing.password !== password) {
      return alert('Incorrect password! Please try again.');
    }

    localStorage.setItem('stem_student_email', cleanEmail);
    setCurrentStudent(existing);
    setPassword('');
    alert(`Welcome back, ${existing.full_name}! 🏆`);
  }

  // Register Account
  async function handleRegister(e) {
    e.preventDefault();
    if (!fullName.trim()) return alert('Please enter your full name.');
    if (!password || password.length < 4) return alert('Password must be at least 4 characters long.');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@stemalex.moe.edu.eg')) {
      return alert('Invalid email! Must end with @stemalex.moe.edu.eg');
    }

    setLoadingAuth(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            full_name: fullName,
            gender: gender,
            grade: grade,
            class_name: className,
          },
        },
      });

      if (error) {
        alert('Registration error: ' + error.message);
        setLoadingAuth(false);
        return;
      }

      if (!data.session) {
        setAuthMode('otp');
        setResendCooldown(60);
        alert(`Verification code sent to ${cleanEmail}! Check your inbox and enter the code.`);
      } else {
        await saveProfileToDatabase(data.user?.id, cleanEmail);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoadingAuth(false);
    }
  }

  async function handleResendCode() {
    if (resendCooldown > 0) return;
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return alert('Please enter your email address first.');

    setLoadingAuth(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: cleanEmail });
      if (error) alert('Resend error: ' + error.message);
      else {
        alert(`A new verification code has been sent to ${cleanEmail}!`);
        setResendCooldown(60);
      }
    } catch (err) {
      alert('Error resending code: ' + err.message);
    } finally {
      setLoadingAuth(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (!otpCode.trim()) return alert('Please enter the verification code.');
    const cleanEmail = email.trim().toLowerCase();
    setLoadingAuth(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: otpCode.trim(),
        type: 'signup',
      });

      if (error) {
        const { data: fallbackData, error: fallbackError } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: otpCode.trim(),
          type: 'email',
        });
        if (fallbackError) throw fallbackError;
        await saveProfileToDatabase(fallbackData.user?.id, cleanEmail);
      } else {
        await saveProfileToDatabase(data.user?.id, cleanEmail);
      }
    } catch (err) {
      alert('Verification failed: ' + err.message);
    } finally {
      setLoadingAuth(false);
    }
  }

  async function saveProfileToDatabase(userId, cleanEmail) {
    const newProfile = {
      id: userId || undefined,
      full_name: fullName,
      email: cleanEmail,
      password: password,
      gender: gender,
      grade: grade,
      class_name: className,
      points: 10,
    };

    const { data: profileData, error } = await supabase
      .from('profiles')
      .upsert([newProfile], { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      alert('Error saving profile: ' + error.message);
    } else {
      localStorage.setItem('stem_student_email', cleanEmail);
      setCurrentStudent(profileData);
      alert('Account registered successfully! 🏆');
      setFullName('');
      setEmail('');
      setPassword('');
      setOtpCode('');
      setAuthMode('login');
      fetchData();
    }
  }

  function handleSignOut() {
    localStorage.removeItem('stem_student_email');
    setCurrentStudent(null);
    setUserDonations([]);
    setAllDonations([]);
  }

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
      setAllDonations([]);
      fetchData();
    }
  }

  async function handleSubmitDonationProof(e) {
    e.preventDefault();
    if (!currentStudent) return alert('Please sign in to donate.');
    if (!donationAmount || Number(donationAmount) <= 0) return alert('Enter a valid donation amount.');
    if (!senderPhone.trim()) return alert('Enter the sender phone number.');
    if (!transactionId.trim()) return alert('Enter the Transaction Reference ID/Number.');

    setSubmittingDonation(true);
    try {
      const { error } = await supabase.from('donations').insert([
        {
          student_id: currentStudent.id,
          item_id: donatingItem.id,
          amount: Number(donationAmount),
          sender_phone: senderPhone.trim(),
          transaction_id: transactionId.trim(),
          status: 'pending',
        },
      ]);

      if (error) {
        alert('Submission failed: ' + error.message);
      } else {
        alert('Donation proof submitted successfully! 📩');
        setDonatingItem(null);
        setDonationAmount('');
        setSenderPhone('');
        setTransactionId('');
        fetchData();
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmittingDonation(false);
    }
  }

  async function handleAdminDonationResponse(donation, approve) {
    if (approve) {
      await supabase.from('donations').update({ status: 'approved' }).eq('id', donation.id);
      const item = fundraising.find((i) => i.id === donation.item_id);
      const newTotal = (Number(item?.raised_amount) || 0) + Number(donation.amount);

      await supabase.from('fundraising').update({ raised_amount: newTotal }).eq('id', donation.item_id);

      const student = students.find((s) => s.id === donation.student_id);
      if (student) {
        await supabase.from('profiles').update({ points: (student.points || 0) + 10 }).eq('id', donation.student_id);
      }
      alert('Donation approved! 🎉');
    } else {
      await supabase.from('donations').update({ status: 'rejected' }).eq('id', donation.id);
      alert('Donation request rejected.');
    }
    fetchData();
  }

  async function handleRespondTeamInvite(membershipId, accept) {
    if (accept) {
      await supabase.from('team_members').update({ status: 'accepted' }).eq('id', membershipId);
      alert('Joined team! 🏆');
    } else {
      await supabase.from('team_members').delete().eq('id', membershipId);
      alert('Invitation declined.');
    }
    fetchData();
  }

  async function handleLeaveTeam(membershipId) {
    if (!confirm('Are you sure you want to leave this team?')) return;
    await supabase.from('team_members').delete().eq('id', membershipId);
    alert('Left team.');
    fetchData();
  }

  async function handleJoinIndividualComp(compId) {
    if (!currentStudent) return alert('Please log in first.');

    const exists = compParticipants.some(
      (p) => p.competition_id === compId && p.student_id === currentStudent.id
    );
    if (exists) return alert('You are already registered in this competition!');

    const { error } = await supabase.from('competition_participants').insert([
      { competition_id: compId, student_id: currentStudent.id, score: 0 },
    ]);

    if (error) alert('Join failed: ' + error.message);
    else {
      alert('Registered for competition! 🏅');
      fetchData();
    }
  }

  async function handleLeaveIndividualComp(participantId) {
    if (!confirm('Sign out of competition?')) return;
    await supabase.from('competition_participants').delete().eq('id', participantId);
    alert('Signed out of competition.');
    fetchData();
  }

  async function handleJoinTeamComp(compId) {
    if (!currentStudent) return alert('Please log in first.');
    if (!teamToRegisterId) return alert('Please select a team to register.');

    const teamObj = teams.find((t) => t.id === teamToRegisterId);
    if (teamObj?.captain_id !== currentStudent.id) {
      return alert('Only the team captain can register the team!');
    }

    const exists = compParticipants.some(
      (p) => p.competition_id === compId && p.team_id === teamToRegisterId
    );
    if (exists) return alert('Team is already registered in this competition!');

    const { error } = await supabase.from('competition_participants').insert([
      { competition_id: compId, team_id: teamToRegisterId, score: 0 },
    ]);

    if (error) alert('Registration failed: ' + error.message);
    else {
      alert(`Team registered for competition! 🛡️`);
      setTeamToRegisterId('');
      fetchData();
    }
  }

  async function handleLeaveTeamComp(participantId) {
    if (!confirm('Withdraw team from competition?')) return;
    await supabase.from('competition_participants').delete().eq('id', participantId);
    alert('Team withdrawn.');
    fetchData();
  }

  async function handleSaveTeam(e) {
    e.preventDefault();
    if (!currentStudent) return alert('Please log in first.');
    if (!newTeamName.trim()) return alert('Please enter a team name.');

    if (editingTeamId) {
      await supabase
        .from('teams')
        .update({ name: newTeamName, team_name: newTeamName, sport: newTeamSport, logo_url: newTeamLogo })
        .eq('id', editingTeamId);

      alert('Team updated successfully!');
      setEditingTeamId(null);
    } else {
      const { data: createdTeam, error } = await supabase
        .from('teams')
        .insert([
          {
            name: newTeamName,
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
          { team_id: createdTeam.id, student_id: currentStudent.id, role: 'Captain', status: 'accepted' },
        ]);
        alert(`Team "${newTeamName}" created!`);
      }
    }

    setNewTeamName('');
    setNewTeamLogo('🛡️');
    fetchData();
  }

  async function handleDeleteTeam(teamId) {
    if (!confirm('Delete this team?')) return;
    await supabase.from('teams').delete().eq('id', teamId);
    alert('Team deleted.');
    fetchData();
  }

  async function handleAddClanMember(teamId) {
    if (!selectedStudentToAdd) return alert('Please select a student to invite.');

    const { error } = await supabase.from('team_members').insert([
      { team_id: teamId, student_id: selectedStudentToAdd, role: 'Member', status: 'pending' },
    ]);

    if (error) alert('Could not send invite: ' + error.message);
    else {
      alert('Invitation sent!');
      setSelectedStudentToAdd('');
      fetchData();
    }
  }

  async function handleRemoveClanMember(membershipId) {
    await supabase.from('team_members').delete().eq('id', membershipId);
    alert('Member removed.');
    fetchData();
  }

  async function handleCreateMatch(e) {
    e.preventDefault();
    if (!challengerTeamId || !opponentTeamId || !matchDateTime) {
      return alert('Select both teams and match date/time.');
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

    if (error) alert('Error: ' + error.message);
    else {
      alert('Friendly Match Challenge sent!');
      setChallengerTeamId('');
      setOpponentTeamId('');
      setMatchDateTime('');
      fetchData();
    }
  }

  async function handleMatchResponse(matchId, newStatus) {
    await supabase.from('matches').update({ status: newStatus }).eq('id', matchId);
    alert(`Match challenge ${newStatus}!`);
    fetchData();
  }

  const isFemale = currentStudent?.gender === 'Female';
  const themeClasses = isFemale
    ? {
        headerBg: 'from-pink-900 via-rose-900 to-pink-950 border-pink-700/50',
        badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
        accentText: 'text-pink-400',
        cardBg: 'bg-slate-900/90 border-pink-900/40',
        buttonBg: 'bg-pink-600 hover:bg-pink-500',
        navActive: 'bg-pink-600 text-white font-bold shadow-lg',
      }
    : {
        headerBg: 'from-blue-950 via-indigo-900 to-slate-900 border-blue-700/50',
        badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        accentText: 'text-cyan-400',
        cardBg: 'bg-slate-900/90 border-blue-900/40',
        buttonBg: 'bg-blue-600 hover:bg-blue-500',
        navActive: 'bg-blue-600 text-white font-bold shadow-lg',
      };

  const myCreatedTeams = teams.filter((t) => t.captain_id === currentStudent?.id);
  const myCreatedTeamIds = myCreatedTeams.map((t) => t.id);

  const myAcceptedMemberships = teamMembers.filter(
    (tm) => tm.student_id === currentStudent?.id && (tm.status === 'accepted' || !tm.status)
  );

  const myJoinedTeams = myAcceptedMemberships
    .map((tm) => {
      const teamObj = teams.find((t) => t.id === tm.team_id);
      return teamObj ? { ...teamObj, membershipId: tm.id, role: tm.role } : null;
    })
    .filter(Boolean);

  const incomingTeamInvites = teamMembers.filter(
    (tm) => tm.student_id === currentStudent?.id && tm.status === 'pending'
  );

  const incomingMatchChallenges = matches.filter(
    (m) => myCreatedTeamIds.includes(m.opponent_team_id) && m.status === 'pending'
  );

  const selectedComp = competitions.find((c) => c.id === selectedCompId);
  const selectedCompParticipants = compParticipants.filter((p) => p.competition_id === selectedCompId);

  const myJoinedCompEntries = compParticipants.filter(
    (p) => p.student_id === currentStudent?.id || myCreatedTeamIds.includes(p.team_id)
  );

  const pendingAdminDonations = allDonations.filter((d) => d.status === 'pending');

  const classStandings = students.reduce((acc, student) => {
    const cls = student.class_name || 'Unassigned';
    acc[cls] = (acc[cls] || 0) + (student.points || 0);
    return acc;
  }, {});

  const sortedClassStandings = Object.entries(classStandings).sort((a, b) => b[1] - a[1]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 font-sans text-slate-100">
      <header className={`text-center bg-gradient-to-r ${themeClasses.headerBg} p-8 rounded-3xl border shadow-2xl flex flex-col md:flex-row justify-between items-center gap-4`}>
        <div className="text-left">
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold inline-block mb-3 border ${themeClasses.badge}`}>
            Ready To Be Our New Champion 🏆
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">STEM Sports Platform</h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1">
            Official Sports Committee Portal for STEM High School - Alexandria
          </p>
        </div>

        {currentStudent?.is_admin && (
          <a
            href="/admin"
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-lg transition text-xs whitespace-nowrap"
          >
            ⚙️ Admin Panel
          </a>
        )}
      </header>

      <nav className="bg-slate-900/90 border border-slate-800 p-2 rounded-2xl flex flex-wrap justify-center gap-1.5 md:gap-2 shadow-xl sticky top-4 z-50 backdrop-blur-md text-xs md:text-sm">
        {[
          { id: 'dashboard', label: '📊 Dashboard' },
          { id: 'teams', label: `🛡️ Teams ${incomingTeamInvites.length > 0 ? `(${incomingTeamInvites.length})` : ''}` },
          { id: 'matches', label: '⚔️ Friendly Matches' },
          { id: 'competitions', label: '🏆 Competitions' },
          { id: 'leaderboard', label: '🥇 Leaderboard' },
          { id: 'stemclass', label: '🏫 STEM CLASS' },
          { id: 'donations', label: `💰 Donations ${pendingAdminDonations.length > 0 ? `(${pendingAdminDonations.length})` : ''}` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl transition duration-200 whitespace-nowrap ${
              activeTab === tab.id
                ? themeClasses.navActive
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {currentStudent ? (
            <section className={`p-6 rounded-2xl border shadow-xl ${themeClasses.cardBg}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-700 pb-4 mb-6 gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-slate-400">Student Profile</span>
                  <h2 className={`text-2xl font-bold flex items-center gap-2 ${themeClasses.accentText}`}>
                    Welcome, {currentStudent.full_name} ({currentStudent.gender})
                    {currentStudent.is_admin && (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-2.5 py-0.5 rounded-md font-extrabold">
                        👑 Admin Leader
                      </span>
                    )}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-lg font-bold text-sm">
                    ⭐ {currentStudent.points || 0} Points
                  </span>
                  <button onClick={handleSignOut} className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-2 rounded-lg">
                    Sign Out
                  </button>
                  <button onClick={handleDeleteAccount} className="bg-red-600/80 hover:bg-red-600 text-white text-xs px-3 py-2 rounded-lg">
                    Delete Account
                  </button>
                </div>
              </div>

              {currentStudent.is_admin && pendingAdminDonations.length > 0 && (
                <div className="mb-6 bg-amber-500/10 border border-amber-500/50 p-4 rounded-2xl space-y-3">
                  <h3 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                    <span>👑</span> ADMIN ALERT: Pending Donations ({pendingAdminDonations.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingAdminDonations.map((don) => (
                      <div key={don.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-white">{don.profiles?.full_name}</span> donated <span className="font-bold text-emerald-400">{don.amount} EGP</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleAdminDonationResponse(don, true)} className="bg-emerald-600 px-3 py-1 rounded text-xs">Approve ✅</button>
                          <button onClick={() => handleAdminDonationResponse(don, false)} className="bg-rose-600 px-3 py-1 rounded text-xs">Reject ❌</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-300 border-b border-slate-800 pb-2 mb-2">Personal Details</h3>
                    <p className="text-xs"><span className="text-slate-400">Email:</span> {currentStudent.email}</p>
                    <p className="text-xs"><span className="text-slate-400">Grade:</span> {currentStudent.grade}</p>
                    <p className="text-xs"><span className="text-slate-400">Class:</span> {currentStudent.class_name}</p>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-300 border-b border-slate-800 pb-2 mb-2">My Teams ({myJoinedTeams.length})</h3>
                    {myJoinedTeams.map((t) => (
                      <div key={t.id} className="text-xs text-white py-1 flex justify-between">
                        <span><TeamLogo logo={t.logo_url} /> {t.name || t.team_name}</span>
                        <span className="text-amber-400 font-bold">{t.points || 0} pts</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-300 border-b border-slate-800 pb-2 mb-2">Tournaments ({myJoinedCompEntries.length})</h3>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-300 border-b border-slate-800 pb-2 mb-2">Contributions</h3>
                    <p className="text-xs text-slate-400">{userDonations.length} records submitted</p>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className={`p-6 rounded-2xl border shadow-xl ${themeClasses.cardBg}`}>
              <div className="flex gap-2 border-b border-slate-800 pb-4 mb-6">
                <button
                  onClick={() => setAuthMode('login')}
                  className={`px-5 py-2 rounded-xl text-xs font-bold ${authMode === 'login' ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400'}`}
                >
                  🔒 Sign In
                </button>
                <button
                  onClick={() => setAuthMode('register')}
                  className={`px-5 py-2 rounded-xl text-xs font-bold ${authMode === 'register' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-400'}`}
                >
                  ✨ Register Account
                </button>
              </div>

              {authMode === 'login' && (
                <form onSubmit={handleSignIn} className="space-y-4 max-w-md mx-auto text-sm">
                  <input
                    type="email"
                    required
                    placeholder="student@stemalex.moe.edu.eg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                  <button className="w-full font-bold py-3 rounded-lg bg-blue-600 text-white">Sign In</button>
                </form>
              )}

              {authMode === 'register' && (
                <form onSubmit={handleRegister} className="grid md:grid-cols-2 gap-4 text-sm">
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                  <input
                    type="email"
                    required
                    placeholder="student@stemalex.moe.edu.eg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                  <input
                    type="password"
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white md:col-span-2"
                  />
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className="bg-slate-950 border border-slate-700 p-2.5 rounded-lg text-white">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  <select value={grade} onChange={(e) => setGrade(e.target.value)} className="bg-slate-950 border border-slate-700 p-2.5 rounded-lg text-white">
                    <option value="G10">Grade 10</option>
                    <option value="G11">Grade 11</option>
                    <option value="G12">Grade 12</option>
                  </select>
                  <button className="md:col-span-2 font-bold py-3 rounded-lg bg-emerald-600 text-white">Create Account</button>
                </form>
              )}
            </section>
          )}
        </div>
      )}

      {/* COMPETITIONS */}
      {activeTab === 'competitions' && (
        <div className="grid md:grid-cols-3 gap-6">
          <section className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h2 className="text-lg font-bold text-yellow-400 border-b border-slate-800 pb-2">🏆 Tournaments</h2>
            {competitions.map((comp) => (
              <div
                key={comp.id}
                onClick={() => setSelectedCompId(comp.id)}
                className={`p-3.5 rounded-xl border cursor-pointer ${
                  comp.id === selectedCompId ? 'bg-amber-500/10 border-amber-500/60' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <h3 className="font-bold text-sm text-white">{comp.title}</h3>
                <span className="text-xxs text-slate-400">{comp.sport}</span>
              </div>
            ))}
          </section>

          <section className="md:col-span-2 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-6">
            {selectedComp && (
              <>
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="text-2xl font-bold text-white">{selectedComp.title}</h2>
                  <p className="text-xs text-slate-400">{selectedComp.description}</p>
                </div>

                <div className="overflow-x-auto bg-slate-950 rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="p-3">Rank</th>
                        <th className="p-3">{selectedComp.type === 'team' ? 'Team' : 'Student'}</th>
                        <th className="p-3">Event Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCompParticipants.map((part, idx) => {
                        const teamObj = teams.find((t) => t.id === part.team_id);
                        const studentObj = students.find((s) => s.id === part.student_id);
                        return (
                          <tr key={part.id} className="border-b border-slate-800/50">
                            <td className="p-3 font-bold text-slate-400">#{idx + 1}</td>
                            <td className="p-3 font-bold text-white">
                              {selectedComp.type === 'team' ? (teamObj?.name || teamObj?.team_name) : studentObj?.full_name}
                            </td>
                            <td className="p-3 text-amber-400 font-bold">{part.score || 0} pts</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {/* OVERALL LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <section className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
            <span>🥇</span> Individual Student Leaderboard
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs">
                  <th className="p-3">Rank</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Class</th>
                  <th className="p-3">Points</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => (
                  <tr key={student.id} className="border-b border-slate-800/50">
                    <td className="p-3 font-bold text-slate-400">#{idx + 1}</td>
                    <td className="p-3 font-semibold text-white">{student.full_name}</td>
                    <td className="p-3 text-slate-300">{student.class_name}</td>
                    <td className="p-3 text-amber-400 font-bold">{student.points || 0} pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* STEM CLASS */}
      {activeTab === 'stemclass' && (
        <section className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-2xl font-bold text-cyan-400">🏫 STEM Class Standings</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {sortedClassStandings.map(([clsName, pts], idx) => (
              <div key={clsName} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-white">Class {clsName}</span>
                <span className="text-amber-400 font-bold">{pts} pts</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* DONATIONS */}
      {activeTab === 'donations' && (
        <section className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-6">
          <h2 className="text-2xl font-bold text-emerald-400">💰 Crowdfunding Equipment</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {fundraising.map((item) => (
              <div key={item.id} className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-white">{item.item_name}</h3>
                  <p className="text-xs text-slate-400 my-2">{item.description}</p>
                  <p className="text-xs text-emerald-400 font-bold">Raised: {item.raised_amount} / {item.target_amount} EGP</p>
                </div>
                <button onClick={() => setDonatingItem(item)} className="w-full bg-emerald-600 text-white py-2 rounded-lg text-xs font-bold mt-4">
                  + Contribute
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
