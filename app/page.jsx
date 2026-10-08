'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://agmumcfifdxwcydzpgqr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_5K3yRDYl2-OxwO78i2mk0A_GV4tDBGl";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// SET YOUR VODAFONE CASH NUMBER AND INSTAPAY USERNAME HERE
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

  // 60-second Resend Cooldown Countdown Timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Class selection rules
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
    const { data: teamData } = await supabase.from('teams').select('*');
    const { data: tmData } = await supabase.from('team_members').select('*');
    const { data: compData } = await supabase.from('competitions').select('*');
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

      // Fetch all donations if Admin
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

  // Handle Sign In with Password Verification
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

  // Step 1: Handle Account Registration via Supabase Auth
  async function handleRegister(e) {
    e.preventDefault();
    if (!fullName.trim()) return alert('Please enter your full name.');
    if (!password || password.length < 4) return alert('Password must be at least 4 characters long.');

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
        setResendCooldown(60); // Start 60-second timer
        alert(`Verification code sent to ${cleanEmail}! Please check your inbox and enter the 6-digit code below.`);
      } else {
        await saveProfileToDatabase(data.user?.id, cleanEmail);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoadingAuth(false);
    }
  }

  // Step 2: Resend OTP Code specifically for existing pending signup
  async function handleResendCode() {
    if (resendCooldown > 0) return;

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return alert('Please enter your email address first.');

    setLoadingAuth(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
      });

      if (error) {
        alert('Resend error: ' + error.message);
      } else {
        alert(`A new verification code has been sent to ${cleanEmail}!`);
        setResendCooldown(60); // Reset 60-second cooldown timer
      }
    } catch (err) {
      alert('Error resending code: ' + err.message);
    } finally {
      setLoadingAuth(false);
    }
  }

  // Step 3: Verify OTP Code and Create Profile
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

  // Helper: Upsert Profile Details into 'profiles' Table
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
      alert('Email verified & Account registered successfully! 🏆');
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

  // Submit Donation Transfer Request
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
        alert('Donation proof submitted successfully! 📩 Your contribution will be verified by the admin shortly.');
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

  // ADMIN: Approve or Reject Donation
  async function handleAdminDonationResponse(donation, approve) {
    if (approve) {
      const { error: donErr } = await supabase
        .from('donations')
        .update({ status: 'approved' })
        .eq('id', donation.id);

      if (donErr) return alert('Error updating donation: ' + donErr.message);

      const item = fundraising.find((i) => i.id === donation.item_id);
      const newTotal = (Number(item?.raised_amount) || 0) + Number(donation.amount);

      await supabase
        .from('fundraising')
        .update({ raised_amount: newTotal })
        .eq('id', donation.item_id);

      const student = students.find((s) => s.id === donation.student_id);
      if (student) {
        await supabase
          .from('profiles')
          .update({ points: (student.points || 0) + 10 })
          .eq('id', donation.student_id);
      }

      alert('Donation approved successfully! Crowdfunding total and student points updated. 🎉');
    } else {
      const { error: donErr } = await supabase
        .from('donations')
        .update({ status: 'rejected' })
        .eq('id', donation.id);

      if (donErr) return alert('Error rejecting donation: ' + donErr.message);
      alert('Donation request rejected.');
    }
    fetchData();
  }

  // Respond to Team Invitation
  async function handleRespondTeamInvite(membershipId, accept) {
    if (accept) {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'accepted' })
        .eq('id', membershipId);

      if (error) alert('Error accepting invite: ' + error.message);
      else {
        alert('You have successfully joined the team! 🏆');
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', membershipId);

      if (error) alert('Error declining invite: ' + error.message);
      else {
        alert('Team invitation declined.');
        fetchData();
      }
    }
  }

  async function handleLeaveTeam(membershipId) {
    if (!confirm('Are you sure you want to leave this team?')) return;
    const { error } = await supabase.from('team_members').delete().eq('id', membershipId);
    if (error) alert('Error leaving team: ' + error.message);
    else {
      alert('You left the team.');
      fetchData();
    }
  }

  // Join Individual Competition
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
      alert('Successfully registered for competition! 🏅');
      fetchData();
    }
  }

  async function handleLeaveIndividualComp(participantId) {
    if (!confirm('Are you sure you want to sign out of this competition?')) return;

    const { error } = await supabase
      .from('competition_participants')
      .delete()
      .eq('id', participantId);

    if (error) alert('Error leaving competition: ' + error.message);
    else {
      alert('Signed out of competition.');
      fetchData();
    }
  }

  // Join Team Competition
  async function handleJoinTeamComp(compId) {
    if (!currentStudent) return alert('Please log in first.');
    if (!teamToRegisterId) return alert('Please select a team to register.');

    const teamObj = teams.find((t) => t.id === teamToRegisterId);
    if (teamObj?.captain_id !== currentStudent.id) {
      return alert('Only the team captain can register the team into competitions!');
    }

    const exists = compParticipants.some(
      (p) => p.competition_id === compId && p.team_id === teamToRegisterId
    );
    if (exists) return alert('This team is already registered in this competition!');

    const { error } = await supabase.from('competition_participants').insert([
      { competition_id: compId, team_id: teamToRegisterId, score: 0 },
    ]);

    if (error) alert('Team registration failed: ' + error.message);
    else {
      alert(`Team "${teamObj.team_name}" registered for competition! 🛡️`);
      setTeamToRegisterId('');
      fetchData();
    }
  }

  async function handleLeaveTeamComp(participantId) {
    if (!confirm('Are you sure you want to withdraw this team from the competition?')) return;

    const { error } = await supabase
      .from('competition_participants')
      .delete()
      .eq('id', participantId);

    if (error) alert('Error withdrawing team: ' + error.message);
    else {
      alert('Team withdrawn from competition.');
      fetchData();
    }
  }

  // Save/Edit Team
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
          { team_id: createdTeam.id, student_id: currentStudent.id, role: 'Captain', status: 'accepted' },
        ]);
        alert(`Clan/Team "${newTeamName}" created successfully!`);
      }
    }

    setNewTeamName('');
    setNewTeamLogo('🛡️');
    fetchData();
  }

  async function handleDeleteTeam(teamId) {
    if (!confirm('Are you sure you want to delete this team/clan?')) return;
    const { error } = await supabase.from('teams').delete().eq('id', teamId);
    if (error) alert('Delete failed: ' + error.message);
    else {
      alert('Team deleted.');
      fetchData();
    }
  }

  async function handleAddClanMember(teamId) {
    if (!selectedStudentToAdd) return alert('Please select a student to invite.');

    const { error } = await supabase.from('team_members').insert([
      { team_id: teamId, student_id: selectedStudentToAdd, role: 'Member', status: 'pending' },
    ]);

    if (error) alert('Could not send invite: ' + error.message);
    else {
      alert('Team invitation sent! The student will join once they accept.');
      setSelectedStudentToAdd('');
      fetchData();
    }
  }

  async function handleRemoveClanMember(membershipId) {
    const { error } = await supabase.from('team_members').delete().eq('id', membershipId);
    if (error) alert('Could not remove member: ' + error.message);
    else {
      alert('Member removed from clan.');
      fetchData();
    }
  }

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

    if (error) alert('Error creating match challenge: ' + error.message);
    else {
      alert('Friendly Match Challenge sent to Opponent Leader!');
      setChallengerTeamId('');
      setOpponentTeamId('');
      setMatchDateTime('');
      fetchData();
    }
  }

  async function handleMatchResponse(matchId, newStatus) {
    const { error } = await supabase
      .from('matches')
      .update({ status: newStatus })
      .eq('id', matchId);

    if (error) alert('Status update failed: ' + error.message);
    else {
      alert(`Match challenge ${newStatus}!`);
      fetchData();
    }
  }

  // Gender Themes
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

      {/* Navigation Bar */}
      <nav className="bg-slate-900/90 border border-slate-800 p-2 rounded-2xl flex flex-wrap justify-center gap-1.5 md:gap-2 shadow-xl sticky top-4 z-50 backdrop-blur-md text-xs md:text-sm">
        {[
          { id: 'dashboard', label: '📊 Dashboard' },
          { id: 'teams', label: `🛡️ Teams ${incomingTeamInvites.length > 0 ? `(${incomingTeamInvites.length})` : ''}` },
          { id: 'matches', label: '⚔️ Friendly Matches' },
          { id: 'competitions', label: '🏆 Competitions' },
          { id: 'leaderboard', label: '🥇 Leaderboard' },
          { id: 'stemclass', label: '🏫 STEM SPORTS CLASS' },
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

      {/* 1. DASHBOARD PAGE */}
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

              {/* ADMIN PANEL ALERT FOR PENDING DONATION APPROVALS */}
              {currentStudent.is_admin && pendingAdminDonations.length > 0 && (
                <div className="mb-6 bg-amber-500/10 border border-amber-500/50 p-4 rounded-2xl space-y-3">
                  <h3 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                    <span>👑</span> ADMIN ALERT: Pending Equipment Donations ({pendingAdminDonations.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingAdminDonations.map((don) => (
                      <div key={don.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-xs">
                        <div>
                          <span className="font-bold text-white">{don.profiles?.full_name}</span> donated <span className="font-bold text-emerald-400">{don.amount} EGP</span> for <span className="underline">{don.fundraising?.item_name}</span>
                          <div className="text-slate-400 text-xxs mt-0.5 space-x-2">
                            <span>Phone: {don.sender_phone}</span>
                            <span>•</span>
                            <span>Tx ID: <strong className="text-slate-200">{don.transaction_id}</strong></span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAdminDonationResponse(don, true)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded text-xs transition"
                          >
                            Approve ✅
                          </button>
                          <button
                            onClick={() => handleAdminDonationResponse(don, false)}
                            className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1 rounded text-xs transition"
                          >
                            Reject ❌
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Team Invitations Alert */}
              {incomingTeamInvites.length > 0 && (
                <div className="mb-6 bg-blue-500/10 border border-blue-500/40 p-4 rounded-xl space-y-3">
                  <h3 className="font-bold text-cyan-300 text-sm flex items-center gap-2">
                    <span>📩</span> Incoming Team Join Requests!
                  </h3>
                  {incomingTeamInvites.map((invite) => {
                    const teamObj = teams.find((t) => t.id === invite.team_id);
                    const captainObj = students.find((s) => s.id === teamObj?.captain_id);
                    return (
                      <div key={invite.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-xs">
                        <div>
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <TeamLogo logo={teamObj?.logo_url} /> {teamObj?.team_name} ({teamObj?.sport})
                          </span>
                          <p className="text-slate-400 text-xxs mt-0.5">
                            Captain <span className="text-slate-200">{captainObj?.full_name}</span> invited you to join their team.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRespondTeamInvite(invite.id, true)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded transition"
                          >
                            Accept & Join
                          </button>
                          <button
                            onClick={() => handleRespondTeamInvite(invite.id, false)}
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

              {/* Incoming Match Challenges Alert */}
              {incomingMatchChallenges.length > 0 && (
                <div className="mb-6 bg-amber-500/10 border border-amber-500/40 p-4 rounded-xl space-y-3">
                  <h3 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                    <span>⚠️</span> Incoming Friendly Match Requests!
                  </h3>
                  {incomingMatchChallenges.map((match) => {
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
                            Accept
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

              {/* 4-Card Dashboard Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-300 border-b border-slate-800 pb-2 mb-2">Personal Details</h3>
                    <p className="text-xs"><span className="text-slate-400">Email:</span> {currentStudent.email}</p>
                    <p className="text-xs"><span className="text-slate-400">Grade:</span> {currentStudent.grade}</p>
                    <p className="text-xs"><span className="text-slate-400">Class:</span> {currentStudent.class_name}</p>
                    <p className="text-xs"><span className="text-slate-400">Gender:</span> {currentStudent.gender}</p>
                  </div>
                  <span className="text-xxs text-amber-400 font-bold block pt-2">Registered Student</span>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                      <h3 className="font-bold text-slate-300">My Teams ({myJoinedTeams.length})</h3>
                      <button
                        onClick={() => setActiveTab('teams')}
                        className="text-xxs text-cyan-400 hover:underline"
                      >
                        View All
                      </button>
                    </div>

                    {myJoinedTeams.length === 0 ? (
                      <p className="text-xs text-slate-500">Not in any team yet.</p>
                    ) : (
                      <ul className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {myJoinedTeams.map((t) => (
                          <li key={t.id} className="text-xs flex items-center justify-between bg-slate-900 p-1.5 rounded border border-slate-800">
                            <span className="font-semibold text-white flex items-center gap-1 truncate pr-1">
                              <TeamLogo logo={t.logo_url} sizeClass="w-4 h-4 text-xs" /> {t.team_name}
                            </span>
                            <span className={`text-xxs px-1.5 py-0.5 rounded font-bold ${
                              t.captain_id === currentStudent.id ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                            }`}>
                              {t.captain_id === currentStudent.id ? 'Captain' : 'Member'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button
                    onClick={() => setActiveTab('teams')}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-xxs py-1.5 rounded text-cyan-300 font-bold transition"
                  >
                    Go to Teams Page →
                  </button>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                      <h3 className="font-bold text-slate-300">Competitions ({myJoinedCompEntries.length})</h3>
                      <button
                        onClick={() => setActiveTab('competitions')}
                        className="text-xxs text-yellow-400 hover:underline"
                      >
                        Browse
                      </button>
                    </div>

                    {myJoinedCompEntries.length === 0 ? (
                      <p className="text-xs text-slate-500">Not in any competition yet.</p>
                    ) : (
                      <ul className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {myJoinedCompEntries.map((entry) => {
                          const comp = competitions.find((c) => c.id === entry.competition_id);
                          const teamObj = teams.find((t) => t.id === entry.team_id);
                          return (
                            <li key={entry.id} className="text-xs bg-slate-900 p-1.5 rounded border border-slate-800 space-y-0.5">
                              <span className="font-semibold text-white block truncate">{comp?.title || 'Tournament'}</span>
                              <span className="text-xxs text-amber-400 block">
                                {entry.team_id ? `Team: ${teamObj?.team_name}` : 'Solo Registration'} ({entry.score} pts)
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                  <button
                    onClick={() => setActiveTab('competitions')}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-xxs py-1.5 rounded text-yellow-300 font-bold transition"
                  >
                    View All Tournaments →
                  </button>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-300 border-b border-slate-800 pb-2 mb-2">My Contributions</h3>
                    {userDonations.length === 0 ? (
                      <p className="text-xs text-slate-500">No equipment donations yet.</p>
                    ) : (
                      <ul className="space-y-1 text-xs max-h-32 overflow-y-auto">
                        {userDonations.map((don) => (
                          <li key={don.id} className="flex justify-between text-slate-300 bg-slate-900 p-1.5 rounded border border-slate-800">
                            <span className="truncate pr-1">{don.fundraising?.item_name || 'Equipment'}</span>
                            <span className={`font-bold text-xxs ${
                              don.status === 'approved' ? 'text-emerald-400' :
                              don.status === 'rejected' ? 'text-rose-400' : 'text-amber-400'
                            }`}>
                              {don.amount} EGP ({don.status || 'pending'})
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button
                    onClick={() => setActiveTab('donations')}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-xxs py-1.5 rounded text-emerald-300 font-bold transition"
                  >
                    Donate Equipment →
                  </button>
                </div>
              </div>
            </section>
          ) : (
            /* Secure Student Login / Registration / OTP Section */
            <section className={`p-6 rounded-2xl border shadow-xl ${themeClasses.cardBg}`}>
              {/* Auth Mode Toggle */}
              <div className="flex gap-2 border-b border-slate-800 pb-4 mb-6">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
                    authMode === 'login'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  🔒 Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
                    authMode === 'register' || authMode === 'otp'
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  ✨ Register Account
                </button>
              </div>

              {/* SIGN IN FORM */}
              {authMode === 'login' && (
                <form onSubmit={handleSignIn} className="space-y-4 max-w-md mx-auto text-sm">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Student Sign In</h2>
                    <p className="text-xs text-slate-400 mb-4">Enter your school email and password to access your account.</p>
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
                    <label className="block text-xs text-slate-300 mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 pr-10 text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs select-none"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? '👁️' : '🙈'}
                      </button>
                    </div>
                  </div>

                  <button className={`w-full font-bold py-3 rounded-lg transition ${themeClasses.buttonBg}`}>
                    Sign In
                  </button>
                </form>
              )}

              {/* REGISTER FORM */}
              {authMode === 'register' && (
                <form onSubmit={handleRegister} className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="md:col-span-2">
                    <h2 className="text-2xl font-bold text-white mb-1">Create Student Profile</h2>
                    <p className="text-xs text-slate-400 mb-2">Register your account to access tournaments and manage teams.</p>
                  </div>

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

                  <div className="md:col-span-2">
                    <label className="block text-xs text-slate-300 mb-1">Create Password (min. 4 characters)</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 pr-10 text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs select-none"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? '👁️' : '🙈'}
                      </button>
                    </div>
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

                  <button
                    disabled={loadingAuth}
                    className="md:col-span-2 mt-2 font-bold py-3 rounded-lg transition bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
                  >
                    {loadingAuth ? 'Sending Verification Code...' : 'Create Account & Get Code ✨'}
                  </button>
                </form>
              )}

              {/* OTP VERIFICATION FORM */}
              {authMode === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4 max-w-md mx-auto text-sm">
                  <div className="bg-emerald-950/50 border border-emerald-500/40 p-4 rounded-xl text-center">
                    <span className="text-2xl block mb-1">📩</span>
                    <h3 className="text-lg font-bold text-emerald-300">Enter Verification Code</h3>
                    <p className="text-xs text-slate-300 mt-1">
                      We sent an OTP code to <strong className="text-white font-mono">{email}</strong>. Please check your school email inbox.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-medium text-center">
                      6-Digit Verification Code (OTP)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={8}
                      placeholder="e.g. 123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-center text-2xl font-mono tracking-widest text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loadingAuth}
                    className="w-full font-bold py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition text-white text-xs disabled:opacity-50"
                  >
                    {loadingAuth ? 'Verifying Code...' : 'Verify Code & Complete Registration 🚀'}
                  </button>

                  <div className="flex justify-between items-center text-xs text-slate-400 pt-2">
                    <button
                      type="button"
                      onClick={() => setAuthMode('register')}
                      className="hover:text-white underline"
                    >
                      ← Back to Registration
                    </button>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={loadingAuth || resendCooldown > 0}
                      className="hover:text-emerald-400 underline disabled:opacity-50 disabled:no-underline"
                    >
                      {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Code'}
                    </button>
                  </div>
                </form>
              )}
            </section>
          )}
        </div>
      )}

      {/* 2. TEAMS PAGE */}
      {activeTab === 'teams' && (
        <div className="space-y-8">
          {incomingTeamInvites.length > 0 && (
            <section className="bg-cyan-950/60 border border-cyan-700/60 p-5 rounded-2xl space-y-3">
              <h2 className="text-lg font-bold text-cyan-300 flex items-center gap-2">
                <span>📩</span> Pending Team Invitations for You
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {incomingTeamInvites.map((invite) => {
                  const teamObj = teams.find((t) => t.id === invite.team_id);
                  const captainObj = students.find((s) => s.id === teamObj?.captain_id);
                  return (
                    <div key={invite.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-white text-sm flex items-center gap-1.5">
                          <TeamLogo logo={teamObj?.logo_url} /> {teamObj?.team_name}
                        </span>
                        <span className="text-slate-400 block mt-1">Sport: {teamObj?.sport}</span>
                        <span className="text-slate-400 block text-xxs">Invited by Captain: {captainObj?.full_name}</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => handleRespondTeamInvite(invite.id, true)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded transition text-xs"
                        >
                          Accept & Join
                        </button>
                        <button
                          onClick={() => handleRespondTeamInvite(invite.id, false)}
                          className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded transition text-xs"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>🛡️</span> All Teams I Belong To ({myJoinedTeams.length})
            </h2>
            {myJoinedTeams.length === 0 ? (
              <p className="text-xs text-slate-500">You are not in any team yet. Accept an invitation or create a team below!</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {myJoinedTeams.map((team) => {
                  const members = teamMembers.filter((tm) => tm.team_id === team.id && (tm.status === 'accepted' || !tm.status));
                  const isCaptain = team.captain_id === currentStudent?.id;

                  return (
                    <div key={team.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <span className="font-bold text-white text-sm flex items-center gap-2">
                          <TeamLogo logo={team.logo_url} /> {team.team_name}
                          <span className="text-xxs font-normal text-slate-400">({team.sport})</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xxs px-2 py-0.5 rounded font-bold ${
                            isCaptain ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {isCaptain ? 'Captain' : 'Member'}
                          </span>
                          {!isCaptain && (
                            <button
                              onClick={() => handleLeaveTeam(team.membershipId)}
                              className="text-red-400 hover:underline text-xxs"
                            >
                              Leave
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-xxs font-bold text-slate-400 uppercase block mb-1">Active Clan Roster:</span>
                        <ul className="space-y-1">
                          {members.map((m) => {
                            const prof = students.find((s) => s.id === m.student_id);
                            return (
                              <li key={m.id} className="flex justify-between items-center text-xxs text-slate-300">
                                <span>👤 {prof?.full_name || 'Student'} ({prof?.class_name})</span>
                                <span className="text-amber-400 font-bold">{m.role}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <div className="grid md:grid-cols-2 gap-6">
            <section className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-xl font-bold text-cyan-400">
                {editingTeamId ? 'Edit Team / Clan' : 'Create New Team / Clan'}
              </h2>
              <form onSubmit={handleSaveTeam} className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Team Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Alex STEM Dragons"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs text-slate-400">Team Logo (Preset or Upload)</label>
                  <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded border border-slate-800">
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
                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
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
                          className="text-xxs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xxs file:font-semibold file:bg-blue-600 file:text-white cursor-pointer"
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
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white"
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
                    className={`w-full text-xs font-bold py-2.5 rounded transition ${themeClasses.buttonBg}`}
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
            </section>

            <section className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-xl font-bold text-slate-200">Teams I Manage (As Captain) & Invites</h2>
              {!currentStudent ? (
                <p className="text-xs text-slate-500">Please register/sign in to manage your teams.</p>
              ) : myCreatedTeams.length === 0 ? (
                <p className="text-xs text-slate-500">You haven't created any teams yet.</p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  {myCreatedTeams.map((team) => {
                    const allMembers = teamMembers.filter((tm) => tm.team_id === team.id);
                    return (
                      <div key={team.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
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

                        <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-2">
                          <span className="text-xxs font-bold text-slate-400 uppercase block mb-1">Roster & Invites:</span>
                          {allMembers.length === 0 ? (
                            <p className="text-xxs text-slate-500">No members or invites sent yet.</p>
                          ) : (
                            <ul className="space-y-1">
                              {allMembers.map((m) => {
                                const prof = students.find((s) => s.id === m.student_id);
                                const isPending = m.status === 'pending';
                                return (
                                  <li key={m.id} className="flex justify-between items-center text-xxs">
                                    <span>
                                      👤 {prof?.full_name || 'Student'} ({prof?.class_name}) - {' '}
                                      {isPending ? (
                                        <span className="text-amber-400 font-semibold">Invite Pending ⏳</span>
                                      ) : (
                                        <span className="text-emerald-400 font-semibold">{m.role}</span>
                                      )}
                                    </span>
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

                          <div className="mt-2.5 flex gap-1 pt-1 border-t border-slate-800">
                            <select
                              value={selectedStudentToAdd}
                              onChange={(e) => setSelectedStudentToAdd(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded text-xxs p-1 text-white"
                            >
                              <option value="">Select Student to Invite...</option>
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
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xxs px-2 rounded font-bold whitespace-nowrap"
                            >
                              + Send Invite
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* 3. FRIENDLY MATCHES PAGE */}
      {activeTab === 'matches' && (
        <div className="grid md:grid-cols-2 gap-8">
          <section className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-xl font-bold text-purple-400">⚔️ Challenge Friendly Match</h2>
            <form onSubmit={handleCreateMatch} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Select Your Team (Challenger)</label>
                <select
                  value={challengerTeamId}
                  onChange={(e) => setChallengerTeamId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  <option value="">Select your team...</option>
                  {myCreatedTeams.map((t) => (
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

          <section className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-xl font-bold text-indigo-400">📅 Scheduled Match List & Status</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
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
      )}

      {/* 4. COMPETITIONS PAGE */}
      {activeTab === 'competitions' && (
        <div className="grid md:grid-cols-3 gap-6">
          <section className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h2 className="text-lg font-bold text-yellow-400 border-b border-slate-800 pb-2">
              🏆 Tournaments
            </h2>
            <div className="space-y-2">
              {competitions.map((comp) => {
                const isSelected = comp.id === selectedCompId;
                const isTeamComp = comp.type === 'team';

                return (
                  <div
                    key={comp.id}
                    onClick={() => setSelectedCompId(comp.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/60 shadow-md'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-xxs px-2 py-0.5 rounded font-bold ${
                        isTeamComp ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}>
                        {isTeamComp ? '🛡️ Team Event' : '👤 Solo Event'}
                      </span>
                      <span className="text-xxs text-slate-400">{comp.sport}</span>
                    </div>
                    <h3 className="font-bold text-sm text-white">{comp.title}</h3>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="md:col-span-2 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-6">
            {selectedComp ? (
              <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 gap-3">
                  <div>
                    <span className={`text-xs px-2.5 py-0.5 rounded font-bold uppercase ${
                      selectedComp.type === 'team' ? 'bg-purple-500/20 text-purple-300' : 'bg-cyan-500/20 text-cyan-300'
                    }`}>
                      {selectedComp.type === 'team' ? 'Team Competition' : 'Individual Solo Tournament'}
                    </span>
                    <h2 className="text-2xl font-bold text-white mt-1">{selectedComp.title}</h2>
                    <p className="text-xs text-slate-400">{selectedComp.description}</p>
                  </div>

                  <div>
                    {selectedComp.type === 'individual' ? (
                      (() => {
                        const myReg = selectedCompParticipants.find((p) => p.student_id === currentStudent?.id);
                        return myReg ? (
                          <button
                            onClick={() => handleLeaveIndividualComp(myReg.id)}
                            className="bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs px-4 py-2 rounded-lg transition"
                          >
                            Sign Out of Competition
                          </button>
                        ) : (
                          <button
                            onClick={() => handleJoinIndividualComp(selectedComp.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition"
                          >
                            + Join Competition
                          </button>
                        );
                      })()
                    ) : (
                      <div className="space-y-2 text-right">
                        <div className="flex gap-2">
                          <select
                            value={teamToRegisterId}
                            onChange={(e) => setTeamToRegisterId(e.target.value)}
                            className="bg-slate-950 border border-slate-700 text-xs rounded p-2 text-white"
                          >
                            <option value="">Select your created team...</option>
                            {myCreatedTeams.map((t) => (
                              <option key={t.id} value={t.id}>{t.logo_url} {t.team_name}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleJoinTeamComp(selectedComp.id)}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3 py-2 rounded transition"
                          >
                            Register Team
                          </button>
                        </div>
                        <span className="text-xxs text-slate-500 block">Must be Team Captain to register</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
                    🏆 Competition Leaderboard & Scoreboard
                  </h3>

                  <div className="overflow-x-auto bg-slate-950 rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="p-3">Rank</th>
                          <th className="p-3">
                            {selectedComp.type === 'team' ? 'Registered Team' : 'Participant Student'}
                          </th>
                          <th className="p-3">
                            {selectedComp.type === 'team' ? 'Captain / Details' : 'Class / Grade'}
                          </th>
                          <th className="p-3">Score / Standing</th>
                          <th className="p-3">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCompParticipants.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="p-4 text-center text-slate-500">
                              No participants registered in this competition yet.
                            </td>
                          </tr>
                        ) : (
                          selectedCompParticipants.map((part, idx) => {
                            if (selectedComp.type === 'team') {
                              const teamObj = teams.find((t) => t.id === part.team_id);
                              const captainObj = students.find((s) => s.id === teamObj?.captain_id);
                              const isMyTeam = teamObj?.captain_id === currentStudent?.id;

                              return (
                                <tr key={part.id} className="border-b border-slate-800/50 hover:bg-slate-900/50">
                                  <td className="p-3 font-bold text-slate-400">#{idx + 1}</td>
                                  <td className="p-3 font-bold text-white flex items-center gap-1.5">
                                    <TeamLogo logo={teamObj?.logo_url} /> {teamObj?.team_name || 'Team'}
                                  </td>
                                  <td className="p-3 text-slate-400">
                                    Captain: {captainObj?.full_name || 'Student'} ({captainObj?.class_name})
                                  </td>
                                  <td className="p-3 text-amber-400 font-bold">{part.score} pts</td>
                                  <td className="p-3">
                                    {isMyTeam && (
                                      <button
                                        onClick={() => handleLeaveTeamComp(part.id)}
                                        className="text-red-400 hover:underline text-xxs"
                                      >
                                        Withdraw Team
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            } else {
                              const studentObj = students.find((s) => s.id === part.student_id);
                              const isMe = studentObj?.id === currentStudent?.id;

                              return (
                                <tr key={part.id} className="border-b border-slate-800/50 hover:bg-slate-900/50">
                                  <td className="p-3 font-bold text-slate-400">#{idx + 1}</td>
                                  <td className="p-3 font-bold text-white">
                                    👤 {studentObj?.full_name || 'Student'}
                                  </td>
                                  <td className="p-3 text-slate-400">
                                    {studentObj?.class_name} ({studentObj?.grade})
                                  </td>
                                  <td className="p-3 text-amber-400 font-bold">{part.score} pts</td>
                                  <td className="p-3">
                                    {isMe && (
                                      <button
                                        onClick={() => handleLeaveIndividualComp(part.id)}
                                        className="text-red-400 hover:underline text-xxs"
                                      >
                                        Sign Out
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            }
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-500">Select a competition to view details.</p>
            )}
          </section>
        </div>
      )}

      {/* 5. OVERALL LEADERBOARD PAGE */}
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
                  <th className="p-3">Grade</th>
                  <th className="p-3">Class</th>
                  <th className="p-3">Gender</th>
                  <th className="p-3">Points</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-slate-500">No students registered yet.</td>
                  </tr>
                ) : (
                  students.map((student, idx) => (
                    <tr key={student.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="p-3 font-bold text-slate-400">#{idx + 1}</td>
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
      )}

      {/* 6. STEM SPORTS CLASS PAGE */}
      {activeTab === 'stemclass' && (
        <section className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
            <span>🏫</span> STEM SPORTS CLASS Standings
          </h2>
          <p className="text-xs text-slate-400">Combined point totals calculated by section class.</p>

          <div className="grid md:grid-cols-3 gap-4">
            {sortedClassStandings.length === 0 ? (
              <p className="text-xs text-slate-500 col-span-3">No class data calculated yet.</p>
            ) : (
              sortedClassStandings.map(([className, totalPoints], index) => (
                <div key={className} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-amber-500 text-slate-950' :
                      index === 1 ? 'bg-slate-300 text-slate-950' :
                      index === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      #{index + 1}
                    </span>
                    <div>
                      <h3 className="font-bold text-white text-base">Class {className}</h3>
                    </div>
                  </div>
                  <span className="text-amber-400 font-black text-lg">{totalPoints} pts</span>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* 7. DONATIONS PAGE */}
      {activeTab === 'donations' && (
        <section className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
              <span>💰</span> Equipment Crowdfunding Tracker
            </h2>
            <p className="text-xs text-slate-400 mt-1">Transparent student-driven funding for new gym equipment and court repairs.</p>
          </div>

          {/* ADMIN VERIFICATION TABLE ON DONATIONS TAB */}
          {currentStudent?.is_admin && pendingAdminDonations.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/40 p-5 rounded-2xl space-y-3">
              <h3 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                <span>👑</span> Admin Verification Queue ({pendingAdminDonations.length} Pending)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="p-3">Student</th>
                      <th className="p-3">Target Item</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Sender Phone</th>
                      <th className="p-3">Tx ID</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingAdminDonations.map((don) => (
                      <tr key={don.id} className="border-b border-slate-800/50">
                        <td className="p-3 font-bold text-white">{don.profiles?.full_name}</td>
                        <td className="p-3 text-slate-300">{don.fundraising?.item_name}</td>
                        <td className="p-3 font-bold text-emerald-400">{don.amount} EGP</td>
                        <td className="p-3 text-slate-300">{don.sender_phone}</td>
                        <td className="p-3 font-mono text-cyan-300">{don.transaction_id}</td>
                        <td className="p-3 space-x-2">
                          <button
                            onClick={() => handleAdminDonationResponse(don, true)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded text-xxs transition"
                          >
                            Approve ✅
                          </button>
                          <button
                            onClick={() => handleAdminDonationResponse(don, false)}
                            className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-2.5 py-1 rounded text-xxs transition"
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

          {/* Crowdfunding Items Grid */}
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
                    onClick={() => setDonatingItem(item)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs transition"
                  >
                    + Contribute / Donate
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* VODAFONE CASH & INSTAPAY DONATION PAYMENT MODAL */}
      {donatingItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 text-sm shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white">Contribute to {donatingItem.item_name}</h3>
              <button
                onClick={() => setDonatingItem(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-xl space-y-2 text-xs">
              <span className="font-bold text-emerald-300 block">📱 Payment Instructions:</span>
              <p className="text-slate-300">Transfer your donation using either method below:</p>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
                <p><strong className="text-amber-400">Vodafone Cash:</strong> <span className="font-mono text-white select-all">{VODAFONE_CASH_NUMBER}</span></p>
                <p><strong className="text-purple-400">InstaPay:</strong> <span className="font-mono text-white select-all">{INSTAPAY_ADDRESS}</span></p>
              </div>
            </div>

            <form onSubmit={handleSubmitDonationProof} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Donation Amount (EGP)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 50"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Your Sender Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="010XXXXXXXX"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Transaction Reference ID / Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TXN98765432"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  disabled={submittingDonation}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-2.5 rounded-lg text-white transition text-xs"
                >
                  {submittingDonation ? 'Submitting...' : 'Submit Donation Proof'}
                </button>
                <button
                  type="button"
                  onClick={() => setDonatingItem(null)}
                  className="bg-slate-800 text-xs text-slate-300 px-4 rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
