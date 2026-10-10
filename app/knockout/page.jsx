'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://agmumcfifdxwcydzpgqr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnbXVtY2ZpZmR4d2N5ZHpwZ3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzODYzNjAsImV4cCI6MjEwNjk2MjM2MH0.ELpZRnnvULXqzteXCinGoZAY0Nrxau0-6qFb0vI2_iE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SPORT_CONFIGS = {
  Football: {
    emoji: '⚽',
    theme: 'from-emerald-950 via-slate-950 to-slate-950 border-emerald-500/30',
    cardBg: 'bg-emerald-950/40 border-emerald-500/30',
    accentText: 'text-emerald-400',
    musicUrl: 'https://raw.githubusercontent.com/effacestudios/Royalty-Free-Music-Pack/master/Sports%20Spirit.mp3',
  },
  Basketball: {
    emoji: '🏀',
    theme: 'from-orange-950 via-slate-950 to-slate-950 border-orange-500/30',
    cardBg: 'bg-orange-950/40 border-orange-500/30',
    accentText: 'text-orange-400',
    musicUrl: 'https://raw.githubusercontent.com/effacestudios/Royalty-Free-Music-Pack/master/The%20Champion.mp3',
  },
  Volleyball: {
    emoji: '🏐',
    theme: 'from-cyan-950 via-slate-950 to-slate-950 border-cyan-500/30',
    cardBg: 'bg-cyan-950/40 border-cyan-500/30',
    accentText: 'text-cyan-400',
    musicUrl: 'https://raw.githubusercontent.com/effacestudios/Royalty-Free-Music-Pack/master/Party%20Time.mp3',
  },
  Chess: {
    emoji: '♟️',
    theme: 'from-amber-950 via-slate-950 to-slate-950 border-amber-500/30',
    cardBg: 'bg-amber-950/40 border-amber-500/30',
    accentText: 'text-amber-300',
    musicUrl: 'https://raw.githubusercontent.com/effacestudios/Royalty-Free-Music-Pack/master/Cinemato.mp3',
  },
  'E-Sports': {
    emoji: '🎮',
    theme: 'from-purple-950 via-slate-950 to-slate-950 border-purple-500/30',
    cardBg: 'bg-purple-950/40 border-purple-500/30',
    accentText: 'text-fuchsia-400',
    musicUrl: 'https://raw.githubusercontent.com/effacestudios/Royalty-Free-Music-Pack/master/Gamer%20Guy.mp3',
  },
  Handball: {
    emoji: '🤾',
    theme: 'from-rose-950 via-slate-950 to-slate-950 border-rose-500/30',
    cardBg: 'bg-rose-950/40 border-rose-500/30',
    accentText: 'text-rose-400',
    musicUrl: 'https://raw.githubusercontent.com/effacestudios/Royalty-Free-Music-Pack/master/Fury.mp3',
  }
};

const DEFAULT_CONFIG = {
  emoji: '🏆',
  theme: 'from-blue-950 via-slate-950 to-slate-950 border-blue-500/30',
  cardBg: 'bg-slate-900/80 border-slate-800',
  accentText: 'text-cyan-400',
  musicUrl: 'https://raw.githubusercontent.com/effacestudios/Royalty-Free-Music-Pack/master/The%20Champion.mp3',
};

function getSportConfig(sportName) {
  if (!sportName) return DEFAULT_CONFIG;
  const cleanName = sportName.trim().toLowerCase();

  for (const key of Object.keys(SPORT_CONFIGS)) {
    if (key.toLowerCase() === cleanName) {
      return SPORT_CONFIGS[key];
    }
  }

  if (cleanName.includes('foot') || cleanName.includes('soccer')) return SPORT_CONFIGS.Football;
  if (cleanName.includes('basket')) return SPORT_CONFIGS.Basketball;
  if (cleanName.includes('volley')) return SPORT_CONFIGS.Volleyball;
  if (cleanName.includes('chess')) return SPORT_CONFIGS.Chess;
  if (cleanName.includes('sport') || cleanName.includes('esport') || cleanName.includes('game')) return SPORT_CONFIGS['E-Sports'];
  if (cleanName.includes('hand')) return SPORT_CONFIGS.Handball;

  return DEFAULT_CONFIG;
}

export default function KnockoutPage() {
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompId, setSelectedCompId] = useState('');
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [knockoutMatches, setKnockoutMatches] = useState([]);

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('knockout-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const selectedComp = competitions.find(c => c.id === selectedCompId) || competitions[0];
  const activeSport = selectedComp?.sport || 'Football';
  const sportConfig = getSportConfig(activeSport);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch((err) => console.log('Playback error:', err));
      }
    }
  }, [selectedCompId, activeSport]);

  async function fetchData() {
    const { data: compData } = await supabase.from('competitions').select('*').order('created_at', { ascending: false });
    const { data: teamsData } = await supabase.from('teams').select('*');
    const { data: playersData } = await supabase.from('profiles').select('*');
    const { data: kmData } = await supabase.from('knockout_matches').select('*');

    if (compData && compData.length > 0) {
      setCompetitions(compData);
      if (!selectedCompId) setSelectedCompId(compData[0].id);
    }
    if (teamsData) setTeams(teamsData);
    if (playersData) setPlayers(playersData);
    if (kmData) setKnockoutMatches(kmData);
  }

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((err) => console.log('Audio error:', err));
    }
  };

  const handleSelectCompetition = (compId) => {
    setSelectedCompId(compId);
    if (!isPlaying && audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const getMatch = (key) => {
    return knockoutMatches.find(
      (m) => (selectedCompId ? m.competition_id === selectedCompId : m.sport === activeSport) && m.match_key === key
    ) || {};
  };

  const renderTeamSlot = (participantId, winnerId) => {
    if (!participantId) {
      return (
        <div className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-center text-slate-600 text-xs italic">
          TBD
        </div>
      );
    }

    const team = teams.find((t) => t.id === participantId);
    const player = !team ? players.find((p) => p.id === participantId) : null;

    const displayName = team ? (team.team_name || team.name) : player ? player.full_name : 'Unknown';
    const logoOrAvatar = team ? team.logo_url : '👤';

    const isWinner = winnerId === participantId;
    const isLoser = winnerId && winnerId !== participantId;

    return (
      <div
        className={`p-2.5 rounded-xl border transition-all duration-500 flex items-center justify-between gap-2 ${
          isWinner
            ? 'bg-emerald-950/90 border-emerald-400 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400 scale-[1.02]'
            : isLoser
            ? 'bg-slate-950/40 border-slate-900 grayscale opacity-30 blur-[0.2px]'
            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {logoOrAvatar && logoOrAvatar.startsWith('http') ? (
            <img src={logoOrAvatar} alt="" className="w-6 h-6 rounded-full object-cover border border-slate-700 flex-shrink-0" />
          ) : (
            <span className="text-base flex-shrink-0">{logoOrAvatar || '🛡️'}</span>
          )}
          <span className={`font-bold text-xs truncate ${isWinner ? 'text-emerald-300 font-black' : isLoser ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
            {displayName}
          </span>
        </div>

        {isWinner && <span className="text-emerald-400 text-xxs font-black px-1.5 py-0.5 bg-emerald-500/20 rounded border border-emerald-500/40">WINNER 🏆</span>}
      </div>
    );
  };

  const renderMatchCard = (matchKey, title) => {
    const match = getMatch(matchKey);
    return (
      <div className={`p-3.5 rounded-2xl border ${sportConfig.cardBg} space-y-2 backdrop-blur-md shadow-2xl`}>
        <div className="flex justify-between items-center border-b border-slate-800/60 pb-1 mb-1">
          <span className="text-xxs uppercase tracking-wider text-slate-400 font-black">
            {title}
          </span>
          <span className="text-xxs text-amber-400 font-bold">{matchKey}</span>
        </div>
        <div className="space-y-1.5">
          {renderTeamSlot(match.team1_id, match.winner_id)}
          <div className="text-center text-xxs text-slate-500 font-black tracking-widest">VS</div>
          {renderTeamSlot(match.team2_id, match.winner_id)}
        </div>
      </div>
    );
  };

  const finalMatch = getMatch('FINAL');
  const championTeam = teams.find((t) => t.id === finalMatch.winner_id);
  const championPlayer = !championTeam ? players.find((p) => p.id === finalMatch.winner_id) : null;
  const champName = championTeam ? (championTeam.team_name || championTeam.name) : championPlayer?.full_name;
  const champLogo = championTeam ? championTeam.logo_url : '👤';

  return (
    <div className={`min-h-screen bg-gradient-to-b ${sportConfig.theme} text-slate-100 p-4 md:p-8 space-y-8 transition-colors duration-700`}>
      <audio ref={audioRef} src={sportConfig.musicUrl} preload="none" loop />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block mb-2">
            🏆 STEM High School Championships
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white flex items-center gap-3">
            <span>{selectedComp ? selectedComp.title : 'Tournament Bracket'}</span>
          </h1>
          {selectedComp && (
            <p className="text-xs font-bold text-amber-400 mt-1 flex items-center gap-2">
              <span>{sportConfig.emoji} Official Sport: <strong>{activeSport}</strong> ({selectedComp.type === 'individual' ? 'Solo' : 'Team'})</span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={toggleMusic}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${
              isPlaying
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {isPlaying ? '🔊 Music Playing (Click to Mute)' : '🔇 Enable Sport Music'}
          </button>

          <Link
            href="/"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-800 transition"
          >
            ← Back Home
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-2">
        <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
          Select Competition To View Bracket & Theme:
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {competitions.length === 0 && (
            <div className="text-xs text-slate-500 bg-slate-900 p-3 rounded-xl">
              No competitions created yet. Create one in the Admin dashboard!
            </div>
          )}
          {competitions.map((comp) => {
            const isActive = comp.id === selectedCompId;
            const compSportConfig = getSportConfig(comp.sport);

            return (
              <button
                key={comp.id}
                onClick={() => handleSelectCompetition(comp.id)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition duration-300 ${
                  isActive
                    ? 'bg-white text-slate-950 font-black shadow-lg scale-105'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {compSportConfig.emoji} {comp.title} ({comp.sport})
              </button>
            );
          })}
        </div>
      </div>

      {champName && (
        <div className="max-w-lg mx-auto bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border-2 border-amber-400 p-6 rounded-3xl text-center space-y-2 shadow-2xl animate-bounce">
          <span className="text-4xl block">👑</span>
          <span className="text-xs uppercase font-extrabold text-amber-300 tracking-widest block">
            {selectedComp?.title} Official Champions
          </span>
          <h2 className="text-3xl font-black text-white flex items-center justify-center gap-2">
            {champLogo?.startsWith('http') ? (
              <img src={champLogo} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-amber-400" />
            ) : (
              <span>{champLogo || '🛡️'}</span>
            )}
            {champName}
          </h2>
        </div>
      )}

      <div className="max-w-7xl mx-auto overflow-x-auto pb-8">
        <div className="min-w-[1100px] grid grid-cols-5 gap-6 items-center">
          <div className="space-y-8">
            <h3 className={`text-xs font-black uppercase text-center tracking-wider ${sportConfig.accentText}`}>
              Left Quarterfinals
            </h3>
            {renderMatchCard('QF1', 'Quarterfinal 1')}
            {renderMatchCard('QF2', 'Quarterfinal 2')}
          </div>

          <div className="space-y-6">
            <h3 className={`text-xs font-black uppercase text-center tracking-wider ${sportConfig.accentText}`}>
              Left Semifinal
            </h3>
            {renderMatchCard('SF1', 'Semifinal 1')}
          </div>

          <div className="space-y-6 text-center">
            <div className="p-4 bg-amber-500/10 border-2 border-amber-500/50 rounded-3xl space-y-2">
              <span className="text-3xl block">🏆</span>
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-300">
                Championship Final
              </h3>
            </div>
            {renderMatchCard('FINAL', 'Grand Final')}
          </div>

          <div className="space-y-6">
            <h3 className={`text-xs font-black uppercase text-center tracking-wider ${sportConfig.accentText}`}>
              Right Semifinal
            </h3>
            {renderMatchCard('SF2', 'Semifinal 2')}
          </div>

          <div className="space-y-8">
            <h3 className={`text-xs font-black uppercase text-center tracking-wider ${sportConfig.accentText}`}>
              Right Quarterfinals
            </h3>
            {renderMatchCard('QF3', 'Quarterfinal 3')}
            {renderMatchCard('QF4', 'Quarterfinal 4')}
          </div>
        </div>
      </div>
    </div>
  );
}
