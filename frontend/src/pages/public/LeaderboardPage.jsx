import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../../api";
import { SkeletonList } from "../../components/Skeleton";

const districts = ["", "Purnea", "Katihar", "Araria", "Kishanganj", "Madhepura", "Saharsa"];

const badgeColors = {
    bronze: "bg-amber-100 text-amber-700 border-amber-300",
    silver: "bg-slate-100 text-slate-600 border-slate-300",
    gold: "bg-yellow-100 text-yellow-700 border-yellow-300",
    platinum: "bg-violet-100 text-violet-700 border-violet-300",
};

export function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState([]);
    const [totalActive, setTotalActive] = useState(0);
    const [loading, setLoading] = useState(true);
    const [district, setDistrict] = useState("");

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({ limit: "20" });
        if (district) params.set("district", district);

        api.get(`/volunteers/leaderboard/?${params.toString()}`)
            .then((res) => {
                setLeaderboard(res.data.leaderboard);
                setTotalActive(res.data.total_active);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [district]);

    return (
        <main className="min-h-screen pb-24 bg-white overflow-hidden">
            {/* Hero */}
            <section className="relative bg-slate-50 border-b border-slate-200/60 pt-20 pb-44 px-6 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none -z-10">
                    <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[50%] bg-amber-100/30 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-[-5%] w-[35%] h-[40%] bg-violet-100/20 rounded-full blur-[100px]" />
                </div>

                <div className="max-w-5xl mx-auto text-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-[10px] font-black uppercase tracking-[0.3em] text-amber-700 shadow-sm"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        Gamification
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="font-display text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-tight"
                    >
                        Volunteer <span className="text-amber-600">Leaderboard.</span>
                    </motion.h1>
                    <p className="max-w-xl mx-auto text-slate-500 font-medium">
                        Recognizing our top contributors who are making Bihar a better place.
                        {totalActive > 0 && (
                            <span className="block mt-2 text-sm text-slate-400">
                                {totalActive} active volunteer{totalActive > 1 ? "s" : ""} with logged service hours
                            </span>
                        )}
                    </p>
                </div>
            </section>

            {/* Filter + Content */}
            <section className="max-w-4xl mx-auto px-6 -mt-24 relative z-20">
                {/* District filter */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-xl p-4 mb-8 flex items-center gap-4">
                    <i className="fas fa-filter text-slate-300 ml-2"></i>
                    <div className="relative flex-1">
                        <select
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-medium focus:outline-none focus:border-amber-400 cursor-pointer"
                        >
                            <option value="">All Districts</option>
                            {districts.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs"></i>
                    </div>
                </div>

                {loading ? (
                    <SkeletonList count={8} />
                ) : leaderboard.length === 0 ? (
                    <div className="bg-slate-50 rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-200">
                        <i className="fas fa-trophy text-4xl text-slate-300 mb-4"></i>
                        <p className="text-slate-500 font-medium">No volunteers with logged hours yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {leaderboard.map((v, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`flex items-center gap-5 p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg ${
                                    v.rank === 1
                                        ? "bg-amber-50 border-amber-200 shadow-md"
                                        : v.rank === 2
                                        ? "bg-slate-50 border-slate-200"
                                        : v.rank === 3
                                        ? "bg-orange-50/50 border-orange-100"
                                        : "bg-white border-slate-100"
                                }`}
                            >
                                {/* Rank */}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shrink-0 ${
                                    v.rank === 1 ? "bg-amber-500 text-white" :
                                    v.rank === 2 ? "bg-slate-400 text-white" :
                                    v.rank === 3 ? "bg-orange-400 text-white" :
                                    "bg-slate-100 text-slate-500"
                                }`}>
                                    {v.rank <= 3 ? (
                                        <i className="fas fa-trophy"></i>
                                    ) : (
                                        <span>{v.rank}</span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-900 truncate">{v.name}</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {v.district}{v.college ? ` • ${v.college}` : ""}
                                    </p>
                                </div>

                                {/* Badges */}
                                <div className="hidden sm:flex gap-1.5">
                                    {v.badges.map((badge, i) => (
                                        <span
                                            key={i}
                                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${badgeColors[badge] || badgeColors.bronze}`}
                                        >
                                            {badge}
                                        </span>
                                    ))}
                                </div>

                                {/* Hours */}
                                <div className="text-right shrink-0">
                                    <p className="text-xl font-display font-bold text-slate-900">{v.total_hours}</p>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Hours</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
