import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiAward, FiDownload, FiExternalLink, FiCalendar, FiShield, FiAlertCircle } from "react-icons/fi";
import { api } from "../../api";
import { useSEO } from "../../hooks/useSEO";

export function CertificatesPage({ volunteer }) {
  useSEO({ title: "My Certificates", description: "View and download your BiharSeva participation certificates.", keywords: "certificates, download certificate, participation", noIndex: true });
    const [certs, setCerts] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedCert, setSelectedCert] = useState(null);

    useEffect(() => {
        if (!volunteer) {
            setError("Login required to view your certificates.");
            setLoading(false);
            return;
        }

        api.get("/certificates/")
            .then((res) => {
                setCerts(res.data);
                setLoading(false);
            })
            .catch((err) => {
                setError("Login required to view your certificates.");
                setLoading(false);
            });
    }, [volunteer]);

    const openCertificate = async (id) => {
        try {
            const res = await api.get(`/certificates/${id}/view/`, { responseType: "blob" });
            const blobUrl = URL.createObjectURL(res.data);
            window.open(blobUrl, "_blank", "noopener,noreferrer");
        } catch {
            setError("Failed to open certificate viewer.");
        }
    };

    const downloadCertificate = async (id, certificateCode) => {
        try {
            const res = await api.get(`/certificates/${id}/download/`, { responseType: "blob" });
            const blobUrl = URL.createObjectURL(res.data);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = `BiharSeva-${certificateCode}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch {
            setError("Download failed. Please try again.");
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-slate-300 uppercase tracking-[0.3em] animate-pulse">Verifying Achievements...</div>;

    return (
        <main className="min-h-screen pb-24 bg-white">
            {/* STANDARD HERO SECTION */}
            <div className="relative bg-slate-50 border-b border-slate-200/60 pb-48 pt-20 overflow-hidden text-center">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-[-5%] w-[40%] h-[50%] bg-emerald-100/20 rounded-full blur-[100px]" />
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-6">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-8 shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        Recognition Portal
                    </span>
                    <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                        Your <span className="text-blue-600">Certificates.</span>
                    </h1>
                    <p className="mt-8 max-w-2xl mx-auto text-lg text-slate-500 font-medium leading-relaxed">
                        Bihar ke prati aapke samarpan ka praman. Har certificate ek swachh aur shrestha Bihar ki taraf aapka ek aur kadam hai.
                    </p>
                </div>
            </div>

            {/* CERTIFICATES GRID (Overlap) */}
            <section className="max-w-7xl mx-auto px-6 -mt-32 relative z-20">
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-12 p-6 bg-red-50 border border-red-100 rounded-[2rem] flex items-center justify-center gap-3 text-red-600 font-bold text-sm">
                            <FiAlertCircle /> {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {certs.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-8">
                        {certs.map((c, index) => (
                            <motion.article
                                key={c.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white p-10 rounded-[1.5rem] border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.04)] hover:shadow-2xl transition-all duration-500 group flex flex-col md:flex-row gap-8 items-center"
                            >
                                {/* Certificate Icon/Badge */}
                                <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center text-4xl shadow-inner shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                    <FiAward />
                                </div>

                                {/* Certificate Content */}
                                <div className="flex-grow text-center md:text-left space-y-3">
                                    <h3 className="text-xl font-display font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{c.event.title}</h3>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
                                            <FiShield className="text-blue-400" /> ID: {c.certificate_id}
                                        </p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
                                            <FiCalendar className="text-blue-400" /> Issued: {c.issued_date}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-3 w-full md:w-auto">
                                    <button onClick={() => setSelectedCert(c)} className="p-4 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest">
                                        <FiExternalLink /> View
                                    </button>
                                    <button onClick={() => downloadCertificate(c.id, c.certificate_id)} className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest">
                                        <FiDownload /> Download
                                    </button>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                ) : !loading && (
                    <div className="bg-white p-20 rounded-[4rem] border border-slate-100 text-center space-y-6">
                        <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto text-4xl">
                            <FiAward />
                        </div>
                        <h3 className="text-xl font-bold text-slate-400 italic">No certificates yet. Join an event and mark your attendance to earn one!</h3>
                        <Link to="/events" className="inline-block px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Browse Missions</Link>
                    </div>
                )}
            </section>

            {/* Certificate Preview Modal */}
            <AnimatePresence>
                {selectedCert && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden relative"
                        >
                            {/* Certificate Frame */}
                            <div className="p-8 md:p-12 border-8 border-double border-amber-400/60 m-3 rounded-[2rem] bg-amber-50/5 relative">
                                
                                {/* Corner Decorations */}
                                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-amber-400" />
                                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-amber-400" />
                                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-amber-400" />
                                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-amber-400" />

                                {/* Close Button */}
                                <button 
                                    onClick={() => setSelectedCert(null)}
                                    className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-all border border-slate-200/50"
                                >
                                    <span className="text-xl font-bold leading-none">&times;</span>
                                </button>

                                {/* Seal/Header */}
                                <div className="text-center space-y-4 mb-8">
                                    <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-yellow-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg text-2xl border-4 border-white">
                                        <FiAward />
                                    </div>
                                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.25em] block">National Service Scheme (NSS)</span>
                                    <h2 className="font-serif text-3xl md:text-4xl font-bold text-slate-800 tracking-wide uppercase">Certificate of Appreciation</h2>
                                    <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mt-2" />
                                </div>

                                {/* Body */}
                                <div className="text-center space-y-6">
                                    <p className="font-medium text-slate-400 italic text-sm">This is proudly presented to</p>
                                    <h3 className="font-serif text-3xl font-extrabold text-slate-900 tracking-tight underline decoration-amber-300 decoration-wavy decoration-2 underline-offset-8">
                                        {volunteer?.name}
                                    </h3>
                                    <p className="text-slate-600 text-sm leading-relaxed max-w-md mx-auto font-medium">
                                        for their exemplary civic contribution, dedication, and active participation in the NSS mission: 
                                        <br />
                                        <span className="text-slate-900 font-bold block text-base mt-2">"{selectedCert.event.title}"</span>
                                    </p>
                                </div>

                                {/* Signatures and Verification */}
                                <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t border-slate-100">
                                    <div className="text-left space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification ID</p>
                                        <p className="text-xs font-mono font-bold text-slate-700 bg-slate-100 py-1.5 px-3 rounded-lg border border-slate-200/50 inline-block">
                                            {selectedCert.certificate_id}
                                        </p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Issue Date</p>
                                        <p className="text-xs font-bold text-slate-700">
                                            {selectedCert.issued_date}
                                        </p>
                                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                            <span className="w-1 h-1 bg-emerald-500 rounded-full"></span> Verified
                                        </span>
                                    </div>
                                </div>

                                {/* Actions in Modal */}
                                <div className="flex flex-col sm:flex-row gap-4 mt-10 relative z-10">
                                    <button 
                                        onClick={() => setSelectedCert(null)}
                                        className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                                    >
                                        Close Preview
                                    </button>
                                    <button 
                                        onClick={() => {
                                            downloadCertificate(selectedCert.id, selectedCert.certificate_id);
                                            setSelectedCert(null);
                                        }}
                                        className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-xl hover:from-amber-600 hover:to-yellow-700"
                                    >
                                        Download PDF
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
