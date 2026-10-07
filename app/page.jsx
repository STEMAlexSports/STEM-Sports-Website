'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://agmumcfifdxwcydzpgqr.supabase.co";
// ⚠️ REPLACE THE STRING BELOW WITH YOUR PUBLISHABLE KEY FROM SUPABASE
const SUPABASE_ANON_KEY = "sb_publishable_5K3yRDYl2-OxwO78i2mk0A_GV4tDBGl";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function Home() {
  const [fundraising, setFundraising] = useState([]);
  const [matches, setMatches] = useState([]);
  const [students, setStudents] = useState([]);

  // Form states
  const [fullName, setFullName] = useState('');
  const [className, setClassName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [sport, setSport] = useState('كرة قدم');
  const [opponent, setOpponent] = useState('');
  const [matchDate, setMatchDate] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: fundData } = await supabase.from('fundraising').select('*');
    const { data: matchData } = await supabase.from('matches').select('*');
    const { data: profData } = await supabase.from('profiles').select('*');

    if (fundData) setFundraising(fundData);
    if (matchData) setMatches(matchData);
    if (profData) setStudents(profData);
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!fullName || !className) return alert('الرجاء إدخال الاسم والفصل');
    
    const fakeId = crypto.randomUUID();
    const { error } = await supabase.from('profiles').insert([
      { id: fakeId, full_name: fullName, class_name: className, points: 10 }
    ]);

    if (error) {
      alert('حدث خطأ أثناء التسجيل: ' + error.message);
    } else {
      alert('تم تسجيل حسابك بنجاح وحصلت على 10 نقاط كبداية!');
      setFullName('');
      setClassName('');
      fetchData();
    }
  }

  async function handleDonate(id, currentAmount) {
    const amount = prompt('أدخل مبلغ التبرع بالجنيه:');
    if (!amount || isNaN(amount) || amount <= 0) return;

    const newAmount = Number(currentAmount) + Number(amount);
    const { error } = await supabase
      .from('fundraising')
      .update({ raised_amount: newAmount })
      .eq('id', id);

    if (error) {
      alert('حدث خطأ: ' + error.message);
    } else {
      alert('شكراً لتبرعك وخدمة المدرسة!');
      fetchData();
    }
  }

  async function handleCreateMatch(e) {
    e.preventDefault();
    if (!teamName || !opponent || !matchDate) return alert('يرجى ملء جميع البيانات');

    const { error } = await supabase.from('matches').insert([
      { sport, match_date: matchDate, status: 'مجدولة' }
    ]);

    if (!error) {
      alert('تم تحدي الفريق بنجاح وجدولة المباراة!');
      setTeamName('');
      setOpponent('');
      setMatchDate('');
      fetchData();
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-12">
      {/* Header */}
      <header className="text-center bg-gradient-to-r from-blue-900 to-indigo-900 p-8 rounded-3xl border border-blue-700/50 shadow-2xl">
        <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-4 py-1.5 rounded-full text-sm font-bold inline-block mb-4">
          🏆 برنامج الترشح للجنة الرياضية
        </span>
        <h1 className="text-4xl md:text-5xl font-black mb-3 text-white">STEM Sports Platform</h1>
        <p className="text-lg text-blue-200">بقيادة الطالب: <span className="text-yellow-400 font-bold">فلوباتير جرجس</span></p>
        <p className="text-sm text-slate-300 mt-2">رؤية جديدة، شفافية كاملة، وتطوير حقيقي للأنشطة الرياضية بالسكن والمدرسة</p>
      </header>

      {/* STEM Sports Class Leaderboard */}
      <section className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-yellow-400">
          <span>🥇</span> منافسة كأس الفصول (STEM SPORTS CLASS)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-sm">
                <th className="p-3">الطالب</th>
                <th className="p-3">الفصل</th>
                <th className="p-3">النقاط</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan="3" className="p-4 text-center text-slate-400">لا يوجد طلاب مسجلين بعد. كن أول المسجلين!</td></tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="border-b border-slate-700/50">
                    <td className="p-3 font-semibold">{student.full_name}</td>
                    <td className="p-3 text-slate-300">{student.class_name}</td>
                    <td className="p-3 text-yellow-400 font-bold">{student.points} نقطة</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Crowdfunding Section */}
      <section className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
        <h2 className="text-2xl font-bold mb-2 text-emerald-400 flex items-center gap-2">
          <span>💰</span> منصة التمويل الجماعي لشراء وتجديد المعدات
        </h2>
        <p className="text-sm text-slate-300 mb-6">شفافية كاملة: شاهد المبالغ المجمعة والمتبقية لشراء احتياجات الملعب والجيم</p>

        <div className="grid md:grid-cols-3 gap-6">
          {fundraising.map((item) => {
            const percent = Math.min(100, Math.round((item.raised_amount / item.target_amount) * 100));
            return (
              <div key={item.id} className="bg-slate-900 p-5 rounded-xl border border-slate-700 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg mb-1 text-white">{item.item_name}</h3>
                  <p className="text-xs text-slate-400 mb-4">{item.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden mb-2">
                    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-slate-300 mb-4">
                    <span>تم جمع: {item.raised_amount} ج.م</span>
                    <span>الهدف: {item.target_amount} ج.م ({percent}%)</span>
                  </div>
                </div>

                <button 
                  onClick={() => handleDonate(item.id, item.raised_amount)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg transition"
                >
                  + المساهمة والتبرع
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Register & Match Creator */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Register Student */}
        <section className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
          <h2 className="text-xl font-bold mb-4 text-blue-400">📝 تسجيل طالب جديد</h2>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs mb-1 text-slate-300">الاسم بالكامل</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: أحمد محمد"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs mb-1 text-slate-300">الفصل / الدفعة</label>
              <input 
                type="text" 
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="مثال: Grade 11 - Class 3"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-2.5 rounded-lg transition">
              إنشاء حساب
            </button>
          </form>
        </section>

        {/* Schedule Match */}
        <section className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
          <h2 className="text-xl font-bold mb-4 text-purple-400">⚽ تحدي مباراة ودية</h2>
          <form onSubmit={handleCreateMatch} className="space-y-4">
            <div>
              <label className="block text-xs mb-1 text-slate-300">اسم فريقك</label>
              <input 
                type="text" 
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="اسم فريقك"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs mb-1 text-slate-300">الفريق المنافس</label>
              <input 
                type="text" 
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                placeholder="اسم الفريق الخصم"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1 text-slate-300">الرياضة</label>
                <select 
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  <option>كرة قدم</option>
                  <option>كرة طائرة</option>
                  <option>شطرنج</option>
                  <option>تنس طاولة</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1 text-slate-300">التاريخ</label>
                <input 
                  type="date" 
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>
            </div>
            <button className="w-full bg-purple-600 hover:bg-purple-500 font-bold py-2.5 rounded-lg transition">
              إرسال التحدي
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
