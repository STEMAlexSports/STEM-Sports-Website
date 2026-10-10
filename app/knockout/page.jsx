'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://agmumcfifdxwcydzpgqr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnbXVtY2ZpZmR4d2N5ZHpwZ3FyIiwicm9sZSI6ImFnbXVtY2ZpZmR4d2N5ZHpwZ3FyIiwiaWF0IjoxNzkxMzg2MzYwLCJleHAiOjIxMDY5NjIzNjB9.ELpZRnnvULXqzteXCinGoZAY0Nrxau0-6qFb0vI2_iE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Custom Per-Sport Themes and Audio Tracks
const SPORT_CONFIGS = {
  Football: {
    theme: 'from-emerald-950 via-slate-950 to-green-950 border-emerald-500/30',
    cardBg: 'bg-emerald-950/40 border-emerald-500/40',
    accentText: 'text-emerald-400',
    musicUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=stadium-rock-113884.mp3',
    musicTitle: ' Stadium Hype Anthem'
  },
  Basketball: {
    theme: 'from-orange-950 via-slate-950 to-amber-950 border-orange-500/30',
    cardBg: 'bg-orange-950/40 border-orange-500/40',
    accentText: 'text-orange-400',
    musicUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=action-hip-hop-10903.mp3',
    musicTitle: ' Court Action Beat'
  },
  Volleyball: {
    theme: 'from-cyan-950 via-slate-950 to-blue-950 border-cyan-500/30',
    cardBg: 'bg-cyan-950/40 border-cyan-500/40',
    accentText: 'text-cyan-400',
    musicUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a1e3b1.mp3?filename=summer-beach-vibes-11883.mp3',
    musicTitle: ' Beach Vibe Groove'
  },
  Chess: {
    theme: 'from-amber-950 via-slate-950 to-stone-950 border-amber-500/30',
    cardBg: 'bg-amber-950/40 border-amber-500/40',
    accentText: 'text-amber-300',
    musicUrl: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_99391d8481.mp3?filename=orchestral-epic-dark-124976.mp3',
    musicTitle: ' Grandmaster Strategy'
  },
  'E-Sports': {
    theme: 'from-purple-950 via-slate-950 to-fuchsia-950 border-purple-500/30',
    cardBg: 'bg-purple-950/40 border-purple-500/40',
    accentText: 'text-fuchsia-400',
    musicUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_55a297e59b.mp3?filename=cyberpunk-2099-10701.mp3',
    musicTitle: ' Cyberpunk Synthwave'
  },
  Handball: {
    theme: 'from-rose-950 via-slate-950 to-red-950 border-rose-500/30',
    cardBg: 'bg-rose-950/40 border-rose-500/40',
    accentText: 'text-rose-400',
    musicUrl: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_db6539bfb1.mp3?filename=energetic-rock-112839.mp3',
    musicTitle: ' High-Octane Arena'
  }
};

const DEFAULT_CONFIG = {
  theme: 'from-blue-950 via-slate-950 to-indigo-950 border-blue-500/30',
  cardBg: 'bg-slate-900/80 border-slate-800',
  accentText: 'text-cyan-400',
  musicUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=stadium-rock-113884.mp3',
  musicTitle: ' Tournament Soundtrack'
};

export default function KnockoutPage() {
  const [sportsList, setSportsList] = useState([]);
  const [activeSport, setActiveSport] = useState('Football');
  const [teams, setTeams] = useState([]);
  const [knockoutMatches, setKnockoutMatches] = useState([]);

  // Audio Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  }, [activeSport]);

  async function fetchData() {
    const { data: sportsData } = await supabase.from('sports').select('*').order('name');
    const { data: teamsData } = await supabase.from('teams').select('*');
    const { data: kmData } = await supabase.from('knockout_matches').select('*');

    if (sportsData && sportsData.length > 0) {
      setSportsList(sportsData);
      if (!activeSport) setActiveSport(sportsData[0].name);
    }
    if (teamsData) setTeams(teamsData);
    if (kmData) setKnockoutMatches(kmData);
  }

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((err) => console.log('Audio autoplay prevented:', err));
    }
  };

  const sportConfig = SPORT_CONFIGS[activeSport] || DEFAULT_CONFIG;

  const getMatch = (key) => {
    return knockoutMatches.find((m) => m.sport === activeSport && m.match_key === key) || {};
  };

  const renderTeamBox = (teamId, winnerId, opponentId) => {
    if (!teamId) {
      return (
        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-center text-slate-600 text-xs italic">
          TBD
        </div>
      );
    }

    const team = teams.find((t) => t.id === teamId);
    const isWinner = winnerId === teamId;
    const isLoser = winnerId && winnerId !== teamId;

    return (
      <div
        className={`p-3 rounded-xl border transition-all duration-500 flex items-center justify-between gap-3 ${
          isWinner
            ? 'bg-emerald-950/80 border-emerald-500 shadow-lg shadow-emerald-500/20 scale-102 ring-1 ring-emerald-400'
            : isLoser
            ? 'bg-slate-950/40 border-slate-900 grayscale opacity-40 blur-[0.3px]'
            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          {team?.logo_url && (
            team.logo_url.startsWith('http') ? (
              <img src={team.logo_url} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-700 flex-shrink-0" />
            ) : (
              <span className="text-lg flex-shrink-0">{team.logo_url}</span>
            )
          )}
          <span className={`font-bold text-xs truncate ${isWinner ? 'text-emerald-300 font-black' : isLoser ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
            {team?.team_name || team?.name || 'Unknown Team'}
          </span>
        </div>

        {isWinner && <span className="text-emerald-400 text-xs font-black">WINNER 🏆</span>}
        {isLoser && <span className="text-slate-600 text-xxs font-semibold">ELIMINATED</span>}
      </div>
    );
  };

  const renderMatchCard = (matchKey, title) => {
    const match = getMatch(matchKey);
    return (
      <div className={`p-4 rounded-2xl border ${sportConfig.cardBg} space-y-2 backdrop-blur-md shadow-xl`}>
        <span className="text-xxs uppercase tracking-wider text-slate-400 font-bold block mb-1">
          {title}
        </span>
        <div className="space-y-2">
          {renderTeamBox(match.team1_id, match.winner_id, match.team2_id)}
          <div className="text-center text-xxs text-slate-500 font-black uppercase">VS</div>
          {renderTeamBox(match.team2_id, match.winner_id, match.team1_id)}
        </div>
      </div>
    );
  };

  // Determine Champion team object
  const finalMatch = getMatch('FINAL');
  const championTeam = teams.find((t) => t.id === finalMatch.winner_id);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${sportConfig.theme} text-slate-100 p-4 md:p-8 space-y-8 transition-colors duration-700`}>
      {/* Background Audio Player */}
      <audio ref={audioRef} src={sportConfig.musicUrl} loop />

      {/* Navigation Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block mb-2">
            🏆 Knockout Championship Stage
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            Final 8 Knockout Brackets
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleMusic}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${
              isPlaying
                ? 'bg-emerald-600 border-emerald-500 text-white animate-pulse'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {isPlaying ? '🔊 Music Playing' : '🔇 Play Music'}
            <span className="text-xxs text-slate-300 opacity-80">({sportConfig.musicTitle})</span>
          </button>

          <a
            href="/"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-800 transition"
          >
            ← Home
          </a>
        </div>
      </div>

      {/* Sport Selector Tabs */}
      <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-2">
        {sportsList.map((sport) => {
          const isActive = sport.name === activeSport;
          return (
            <button
              key={sport.id}
              onClick={() => setActiveSport(sport.name)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition duration-300 ${
                isActive
                  ? 'bg-white text-slate-950 font-black shadow-lg scale-105'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {sport.emoji} {sport.name}
            </button>
          );
        })}
      </div>

      {/* CHAMPION BANNER DISPLAY */}
      {championTeam && (
        <div className="max-w-xl mx-auto bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border-2 border-amber-400 p-6 rounded-3xl text-center space-y-2 shadow-2xl animate-bounce">
          <span className="text-4xl block">👑</span>
          <span className="text-xs uppercase font-extrabold text-amber-300 tracking-widest block">
            {activeSport} Tournament Champions
          </span>
          <h2 className="text-3xl font-black text-white flex items-center justify-center gap-2">
            {championTeam.logo_url?.startsWith('http') ? (
              <img src={championTeam.logo_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-amber-400" />
            ) : (
              <span>{championTeam.logo_url || '🛡️'}</span>
            )}
            {championTeam.team_name || championTeam.name}
          </h2>
        </div>
      )}

      {/* 8-TEAM KNOCKOUT BRACKET GRID */}
      <div className="max-w-7xl mx-auto overflow-x-auto pb-6">
        <div className="min-w-[900px] grid grid-cols-3 gap-8 items-center">
          
          {/* COLUMN 1: QUARTERFINALS (4 MATCHES) */}
          <div className="space-y-6">
            <h3 className={`text-sm font-black uppercase text-center tracking-wider ${sportConfig.accentText}`}>
              Quarterfinals (Top 8)
            </h3>
            {renderMatchCard('QF1', 'Quarterfinal 1')}
            {renderMatchCard('QF2', 'Quarterfinal 2')}
            {renderMatchCard('QF3', 'Quarterfinal 3')}
            {renderMatchCard('QF4', 'Quarterfinal 4')}
          </div>

          {/* COLUMN 2: SEMIFINALS (2 MATCHES) */}
          <div className="space-y-12">
            <h3 className={`text-sm font-black uppercase text-center tracking-wider ${sportConfig.accentText}`}>
              Semifinals (Top 4)
            </h3>
            {renderMatchCard('SF1', 'Semifinal 1 (Winner QF1 vs QF2)')}
            {renderMatchCard('SF2', 'Semifinal 2 (Winner QF3 vs QF4)')}
          </div>

          {/* COLUMN 3: GRAND FINAL (1 MATCH) */}
          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase text-center tracking-wider text-amber-400">
              🏆 Grand Final
            </h3>
            {renderMatchCard('FINAL', 'Championship Match')}
          </div>

        </div>
      </div>
    </div>
  );
}
