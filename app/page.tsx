"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toPng } from "html-to-image";
import {
  Trophy,
  Flame,
  UserCheck,
  BarChart3,
  History,
  Send,
  PlusCircle,
  Award,
  Swords,
  CheckCircle2,
  TrendingUp,
  Crown,
  Sparkles,
  Zap,
  ChevronLeft,
  ChevronRight,
  Download,
  MessageSquare,
  Ghost,
  Share2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";

interface MatchRecord {
  id?: string;
  session_id?: string;
  player_name: string;
  result: "win" | "lose";
  wins_count: number;
  loss_count: number;
  elo_change?: number;
  created_at: string;
}

interface Player {
  id: string;
  name: string;
}

interface PlayerStats {
  name: string;
  wins: number;
  losses: number;
  totalMatches: number;
  winRate: number;
  lp: number;
  rankTitle: string;
  rankBadgeColor: string;
  streak: { type: "win" | "lose" | "none"; count: number };
}

interface Comment {
  id: string;
  nickname: string;
  content: string;
  avatar_seed: string;
  created_at: string;
}

const getRankInfo = (lp: number) => {
  if (lp >= 1600) return { title: "Thách Đấu 🏆", color: "bg-amber-100 text-amber-900 border-amber-300 font-black" };
  if (lp >= 1450) return { title: "Đại Cao Thủ 👑", color: "bg-rose-100 text-rose-900 border-rose-300 font-black" };
  if (lp >= 1300) return { title: "Cao Thủ 🟣", color: "bg-purple-100 text-purple-900 border-purple-300 font-bold" };
  if (lp >= 1200) return { title: "Kim Cương 💎", color: "bg-cyan-100 text-cyan-900 border-cyan-300 font-bold" };
  if (lp >= 1100) return { title: "Bạch Kim 🟢", color: "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold" };
  if (lp >= 1000) return { title: "Vàng 🟡", color: "bg-yellow-100 text-yellow-900 border-yellow-300 font-bold" };
  if (lp >= 900) return { title: "Bạc ⚪", color: "bg-slate-100 text-slate-800 border-slate-300 font-semibold" };
  if (lp >= 800) return { title: "Đồng 🟤", color: "bg-orange-100 text-orange-900 border-orange-300 font-semibold" };
  return { title: "Sắt ⬛", color: "bg-zinc-200 text-zinc-800 border-zinc-400 font-semibold" };
};

export default function ChaoLuaDashboard() {
  const [playersList, setPlayersList] = useState<Player[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [result, setResult] = useState<"win" | "lose">("win");
  const [matchCount, setMatchCount] = useState<number>(1);
  const [records, setRecords] = useState<MatchRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showWelcomeEffect, setShowWelcomeEffect] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [filterPlayer, setFilterPlayer] = useState<string>("all");
  const [filterResult, setFilterResult] = useState<"all" | "win" | "lose">("all");

  // State cho Bình luận ẩn danh
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentNickname, setCommentNickname] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Phân trang BXH
  const [leaderboardPage, setLeaderboardPage] = useState<number>(1);
  const itemsPerPage = 5;

  // Ref chụp ảnh BXH
  const leaderboardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchPlayers();
    fetchRecords();
    fetchComments();

    const timer = setTimeout(() => setShowWelcomeEffect(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase.from("players").select("*").order("name", { ascending: true });
      if (error) console.error(error);
      else if (data) setPlayersList(data as Player[]);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase.from("match_logs").select("*").order("created_at", { ascending: true });
      if (error) console.error(error);
      else if (data) setRecords(data as MatchRecord[]);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("anonymous_comments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) console.error(error);
      else if (data) setComments(data as Comment[]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName) {
      alert("Vui lòng chọn tên người chơi!");
      return;
    }

    setIsSubmitting(true);
    const count = Number(matchCount);
    const eloChange = result === "win" ? count * 22 : -(count * 18);

    const newRecord = {
      session_id: crypto.randomUUID(),
      player_name: playerName,
      result,
      wins_count: result === "win" ? count : 0,
      loss_count: result === "lose" ? count : 0,
      elo_change: eloChange,
    };

    const { data, error } = await supabase.from("match_logs").insert([newRecord]).select();

    if (error) {
      alert(`Lỗi lưu dữ liệu: ${error.message}`);
    } else if (data) {
      fetchRecords();
      setResult("win");
      setMatchCount(1);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3600);
    }

    setIsSubmitting(false);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setIsPostingComment(true);
    const randomAvatarSeed = Math.floor(Math.random() * 1000).toString();

    const newComment = {
      nickname: commentNickname.trim() || "Thành viên ẩn danh",
      content: commentContent.trim(),
      avatar_seed: randomAvatarSeed,
    };

    const { error } = await supabase.from("anonymous_comments").insert([newComment]);

    if (error) {
      alert("Lỗi khi gửi bình luận: " + error.message);
    } else {
      setCommentContent("");
      fetchComments();
    }
    setIsPostingComment(false);
  };

  // Xuất ảnh Bảng Xếp Hạng
  const exportLeaderboardImage = async () => {
    if (!leaderboardRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(leaderboardRef.current, { cacheBust: true, quality: 0.95 });
      const link = document.createElement("a");
      link.download = `ChaoLua-BXH-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Lỗi xuất ảnh:", err);
      alert("Không thể chụp ảnh Bảng Xếp Hạng, vui lòng thử lại!");
    }
    setIsExporting(false);
  };

  // Tính toán Elo, WinRate và Chuỗi Thắng/Thua (Streak)
  const getPlayerStatsMap = () => {
    const stats: Record<string, PlayerStats> = {};

    playersList.forEach((p) => {
      stats[p.name] = {
        name: p.name,
        wins: 0,
        losses: 0,
        totalMatches: 0,
        winRate: 0,
        lp: 1000,
        rankTitle: "Vàng 🟡",
        rankBadgeColor: "",
        streak: { type: "none", count: 0 },
      };
    });

    const playerMatchHistories: Record<string, ("win" | "lose")[]> = {};

    records.forEach((r) => {
      if (!stats[r.player_name]) {
        stats[r.player_name] = {
          name: r.player_name,
          wins: 0,
          losses: 0,
          totalMatches: 0,
          winRate: 0,
          lp: 1000,
          rankTitle: "Vàng 🟡",
          rankBadgeColor: "",
          streak: { type: "none", count: 0 },
        };
      }

      if (!playerMatchHistories[r.player_name]) {
        playerMatchHistories[r.player_name] = [];
      }

      const p = stats[r.player_name];
      if (r.result === "win") {
        const wins = r.wins_count || 1;
        p.wins += wins;
        p.totalMatches += wins;
        p.lp += r.elo_change || wins * 22;
        for (let i = 0; i < wins; i++) playerMatchHistories[r.player_name].push("win");
      } else {
        const losses = r.loss_count || 1;
        p.losses += losses;
        p.totalMatches += losses;
        p.lp += r.elo_change || -(losses * 18);
        for (let i = 0; i < losses; i++) playerMatchHistories[r.player_name].push("lose");
      }
    });

    // Tính Chuỗi Thắng/Thua (Streak)
    Object.keys(stats).forEach((pName) => {
      const history = playerMatchHistories[pName] || [];
      if (history.length === 0) return;

      const lastResult = history[history.length - 1];
      let streakCount = 0;

      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i] === lastResult) {
          streakCount++;
        } else {
          break;
        }
      }

      stats[pName].streak = {
        type: lastResult,
        count: streakCount,
      };
    });

    Object.values(stats).forEach((p) => {
      p.winRate = p.totalMatches > 0 ? Math.round((p.wins / p.totalMatches) * 100) : 0;
      const rankInfo = getRankInfo(p.lp);
      p.rankTitle = rankInfo.title;
      p.rankBadgeColor = rankInfo.color;
    });

    return stats;
  };

  const statsList = Object.values(getPlayerStatsMap());
  const activePlayersStats = statsList.filter((p) => p.totalMatches > 0);
  const leaderboard = [...activePlayersStats].sort((a, b) => b.lp - a.lp || b.winRate - a.winRate);
  const topPlayer = leaderboard.length > 0 ? leaderboard[0] : null;

  const totalLeaderboardPages = Math.ceil(leaderboard.length / itemsPerPage) || 1;
  const paginatedLeaderboard = leaderboard.slice(
    (leaderboardPage - 1) * itemsPerPage,
    leaderboardPage * itemsPerPage
  );

  const calculateActualTotalMatches = () => {
    const totalIndividualPlayerMatches = records.reduce((acc, r) => {
      return acc + (r.result === "win" ? r.wins_count || 1 : r.loss_count || 1);
    }, 0);
    if (totalIndividualPlayerMatches === 0) return 0;
    return Math.ceil(totalIndividualPlayerMatches / 10);
  };

  const getLpHistoryChartData = () => {
    const playerLpTracker: Record<string, number> = {};
    playersList.forEach((p) => (playerLpTracker[p.name] = 1000));
    const timePoints: Array<Record<string, string | number>> = [];

    records.forEach((r) => {
      const currentLp = playerLpTracker[r.player_name] || 1000;
      const change = r.elo_change || (r.result === "win" ? 22 : -18);
      playerLpTracker[r.player_name] = currentLp + change;

      const dateStr = new Date(r.created_at).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      });

      timePoints.push({
        time: dateStr,
        ...playerLpTracker,
      });
    });

    return timePoints.slice(-15);
  };

  const filteredRecords = [...records]
    .reverse()
    .filter((r) => {
      const matchPlayer = filterPlayer === "all" || r.player_name === filterPlayer;
      const matchResult = filterResult === "all" || r.result === filterResult;
      return matchPlayer && matchResult;
    });

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-slate-800 font-sans pb-16">
      {/* Background Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-20 h-96 w-96 rounded-full bg-pink-300/30 blur-3xl" />
        <div className="absolute -right-20 top-60 h-96 w-96 rounded-full bg-purple-300/30 blur-3xl" />
        <div className="absolute left-1/3 top-0 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" />
      </div>

      {/* BANNER CHÀO MỪNG */}
      {showWelcomeEffect && (
        <div className="pointer-events-none fixed top-5 left-1/2 -translate-x-1/2 z-[80] w-auto max-w-md animate-welcomeFade">
          <div className="rounded-2xl border border-amber-300 bg-white/95 px-6 py-3 text-center shadow-xl shadow-amber-500/10 backdrop-blur-xl flex items-center gap-3">
            <div className="text-2xl animate-bounce">🔥</div>
            <div className="text-left">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">
                Đấu Trường Chảo Lửa
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Hệ Thống Xếp Hạng & Biểu Đồ Thống Kê Chuẩn
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toast thông báo */}
      {showSuccess && (
        <div className="fixed right-4 top-20 z-[70] w-[calc(100%-2rem)] max-w-sm animate-toastIn">
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-300 bg-white/95 p-4 shadow-2xl shadow-emerald-500/10 backdrop-blur-xl">
            <div className="rounded-full bg-emerald-100 p-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Đã cập nhật dữ liệu thành công! 🎉</p>
              <p className="mt-0.5 text-xs text-slate-500">Biểu đồ và xếp hạng đã được làm mới.</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/80 bg-white/80 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="rounded-xl bg-gradient-to-tr from-orange-500 via-amber-500 to-rose-500 p-2.5 text-white shadow-md shadow-orange-500/20">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase sm:text-2xl flex items-center gap-2">
                Chảo Lửa Ranking <Sparkles className="w-4 h-4 text-amber-500" />
              </h1>
              <p className="text-xs font-medium text-slate-500">
                Thống Kê Chi Tiết Trận Đấu Custom LMHT
              </p>
            </div>
          </div>
          <div className="hidden items-center space-x-2 rounded-full border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-700 sm:flex">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Mùa Giải 2026</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl space-y-8 px-4 pt-8 sm:px-6 lg:px-8">
        {/* 3 CARD THỐNG KÊ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-lg shadow-slate-200/50 backdrop-blur flex items-center space-x-4">
            <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600">
              <Swords className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Trận Cả Nhóm Đã Đánh</p>
              <p className="text-2xl font-black text-indigo-600">
                {calculateActualTotalMatches()} <span className="text-xs text-slate-400 font-bold">Trận thực tế</span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/80 to-orange-50/80 p-5 shadow-lg shadow-amber-500/5 backdrop-blur flex items-center space-x-4">
            <div className="rounded-xl bg-amber-400 p-3 text-white shadow-md shadow-amber-400/30">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Vua Chảo Lửa (Top 1 LP)</p>
              <p className="text-xl font-black text-amber-900">
                {topPlayer ? `${topPlayer.name} (${topPlayer.lp} LP)` : "Chưa có"}
              </p>
              <p className="text-[11px] text-amber-700 font-bold">{topPlayer?.rankTitle}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-lg shadow-slate-200/50 backdrop-blur flex items-center space-x-4">
            <div className="rounded-xl bg-rose-100 p-3 text-rose-600">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tỷ Lệ Thắng Cao Nhất</p>
              <p className="text-xl font-black text-rose-600">
                {topPlayer ? `${topPlayer.winRate}% (${topPlayer.wins}W - ${topPlayer.losses}L)` : "Chưa có"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* CỘT TRÁI (5 Cột) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Form Nhập Trận */}
            <div className="rounded-2xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-200/60 backdrop-blur">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-5">
                <PlusCircle className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">Báo Cáo Kết Quả Trận</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Tên người chơi
                  </label>
                  <div className="relative">
                    <UserCheck className="w-5 h-5 text-slate-400 absolute left-3 top-3.5 z-10" />
                    <select
                      required
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer"
                    >
                      <option value="">-- Chọn thành viên --</option>
                      {playersList.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Kết quả
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setResult("win")}
                      className={`py-3 px-4 rounded-xl text-sm font-black border transition-all flex items-center justify-center space-x-2 ${
                        result === "win"
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span>🏆 THẮNG (+LP)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setResult("lose")}
                      className={`py-3 px-4 rounded-xl text-sm font-black border transition-all flex items-center justify-center space-x-2 ${
                        result === "lose"
                          ? "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/25"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span>💔 THUA (-LP)</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Số trận {result === "win" ? "Thắng" : "Thua"} của bạn
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={matchCount}
                    onChange={(e) => setMatchCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-black py-3 px-4 rounded-xl shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? "Đang cập nhật..." : "GỬI KẾT QUẢ"}</span>
                </button>
              </form>
            </div>

            {/* BẢNG XẾP HẠNG RANK (TÍCH HỢP XUẤT ẢNH & HUY HIỆU STREAK) */}
            <div className="rounded-2xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-200/60 backdrop-blur flex flex-col justify-between">
              <div ref={leaderboardRef} className="bg-white p-2 rounded-xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <h2 className="text-lg font-bold text-slate-900">Bảng Xếp Hạng LP</h2>
                  </div>
                  <button
                    onClick={exportLeaderboardImage}
                    disabled={isExporting}
                    className="flex items-center space-x-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-bold border border-indigo-200 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExporting ? "Đang tạo..." : "Tải Ảnh BXH"}</span>
                  </button>
                </div>

                {paginatedLeaderboard.length > 0 ? (
                  <div className="space-y-3">
                    {paginatedLeaderboard.map((player, idx) => {
                      const realRankIndex = (leaderboardPage - 1) * itemsPerPage + idx;

                      return (
                        <div
                          key={player.name}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 hover:border-indigo-300 transition"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                                  realRankIndex === 0
                                    ? "bg-amber-400 text-white shadow-md shadow-amber-400/40"
                                    : realRankIndex === 1
                                    ? "bg-slate-300 text-slate-700"
                                    : realRankIndex === 2
                                    ? "bg-amber-700 text-white"
                                    : "bg-slate-200 text-slate-600"
                                }`}
                              >
                                {realRankIndex + 1}
                              </span>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-extrabold text-slate-900 text-sm">
                                    {player.name}
                                  </span>

                                  {/* HIỂN THỊ STREAK BADGE */}
                                  {player.streak.type === "win" && player.streak.count >= 2 && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded-full font-black animate-pulse">
                                      🔥 Thắng {player.streak.count}
                                    </span>
                                  )}
                                  {player.streak.type === "lose" && player.streak.count >= 2 && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] bg-blue-100 text-blue-800 border border-blue-300 px-1.5 py-0.5 rounded-full font-black">
                                      ❄️ Thua {player.streak.count}
                                    </span>
                                  )}
                                </div>
                                <span className={`inline-block text-[10px] px-2 py-0.5 rounded border mt-0.5 ${player.rankBadgeColor}`}>
                                  {player.rankTitle}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="font-black text-indigo-600 text-base block">
                                {player.lp} LP
                              </span>
                              <span className="text-[11px] text-slate-500 font-semibold">
                                {player.winRate}% Thắng ({player.wins}W - {player.losses}L)
                              </span>
                            </div>
                          </div>

                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                              style={{ width: `${player.winRate}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-sm font-medium">
                    Chưa có người chơi nào thi đấu
                  </div>
                )}
              </div>

              {/* THANH PHÂN TRANG */}
              {totalLeaderboardPages > 1 && (
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setLeaderboardPage((prev) => Math.max(prev - 1, 1))}
                    disabled={leaderboardPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center space-x-1.5">
                    {Array.from({ length: totalLeaderboardPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setLeaderboardPage(page)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                          leaderboardPage === page
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setLeaderboardPage((prev) => Math.min(prev + 1, totalLeaderboardPages))}
                    disabled={leaderboardPage === totalLeaderboardPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: BIỂU ĐỒ, LỊCH SỬ & BÌNH LUẬN ẨN DANH (7 Cột) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* BIỂU ĐỒ THỐNG KÊ THẮNG / THUA CÁ NHÂN */}
            <div className="rounded-2xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-200/60 backdrop-blur">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-bold text-slate-900">Thống Kê Thắng / Thua Cá Nhân</h2>
                </div>
                <span className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-md font-bold">
                  {activePlayersStats.length} Người đã thi đấu
                </span>
              </div>

              <div className="h-80 w-full">
                {isMounted && activePlayersStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={activePlayersStats}
                      margin={{ top: 25, right: 15, left: -15, bottom: 45 }}
                      barGap={6}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        angle={-30}
                        textAnchor="end"
                        tick={{ fill: "#334155", fontSize: 12, fontWeight: 700 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Bar dataKey="wins" name="Trận Thắng" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24}>
                        <LabelList dataKey="wins" position="top" fill="#047857" fontSize={11} fontWeight={800} />
                      </Bar>
                      <Bar dataKey="losses" name="Trận Thua" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={24}>
                        <LabelList dataKey="losses" position="top" fill="#be123c" fontSize={11} fontWeight={800} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm font-semibold">
                    Chưa có người chơi nào có lịch sử thi đấu
                  </div>
                )}
              </div>
            </div>

            {/* BIỂU ĐỒ BIẾN ĐỘNG LP */}
            <div className="rounded-2xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-200/60 backdrop-blur">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                  <h2 className="text-lg font-bold text-slate-900">Biến Động Điểm LP Rank</h2>
                </div>
                <span className="text-xs text-slate-400 font-semibold">Theo thời gian</span>
              </div>

              <div className="h-64 w-full">
                {isMounted && getLpHistoryChartData().length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getLpHistoryChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} domain={['dataMin - 30', 'dataMax + 30']} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Legend />
                      {playersList.map((p, index) => {
                        const colors = ["#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#3b82f6", "#ef4444"];
                        return (
                          <Line
                            key={p.id}
                            type="monotone"
                            dataKey={p.name}
                            stroke={colors[index % colors.length]}
                            strokeWidth={3}
                            dot={{ r: 3 }}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                    Chưa đủ dữ liệu phong độ
                  </div>
                )}
              </div>
            </div>
                {/* PHẦN BÌNH LUẬN ẨN DANH (CHÉM GIÓ / GÁY) */}
<div className="rounded-2xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-200/60 backdrop-blur">
  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
    <div className="flex items-center space-x-2">
      <Ghost className="w-5 h-5 text-purple-600" />
      <h2 className="text-lg font-bold text-slate-900">Góc Chém Gió Ẩn Danh</h2>
    </div>
    <span className="text-xs text-slate-400 font-medium">
      {comments.length} Bình luận
    </span>
  </div>

  {/* Form Gửi Bình Luận (Đã bỏ nhập tên) */}
  <form onSubmit={handlePostComment} className="mb-6 space-y-3">
    <div className="flex gap-2">
      <input
        type="text"
        required
        placeholder="Nhập nội dung gáy / bình luận ẩn danh..."
        value={commentContent}
        onChange={(e) => setCommentContent(e.target.value)}
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
      />
      <button
        type="submit"
        disabled={isPostingComment}
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-md shadow-purple-500/20 transition flex items-center justify-center space-x-2 whitespace-nowrap disabled:opacity-50"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        <span>{isPostingComment ? "Đang gửi..." : "GỬI"}</span>
      </button>
    </div>
  </form>

  {/* Danh sách bình luận */}
  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
    {comments.length > 0 ? (
      comments.map((c) => (
        <div
          key={c.id}
          className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start space-x-3"
        >
          <img
            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${c.avatar_seed}`}
            alt="avatar"
            className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 flex-shrink-0"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-purple-900">
                {c.nickname}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {new Date(c.created_at).toLocaleString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                })}
              </span>
            </div>
            <p className="text-xs text-slate-700 mt-1 font-medium">{c.content}</p>
          </div>
        </div>
      ))
    ) : (
      <div className="py-6 text-center text-slate-400 text-xs">
        Chưa có bình luận nào. Hãy là người đầu tiên mở bát!
      </div>
    )}
  </div>
</div>

            {/* LỊCH SỬ ĐẤU */}
            <div className="rounded-2xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-200/60 backdrop-blur">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center space-x-2">
                  <History className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-bold text-slate-900">Lịch Sử Khai Báo Gần Đây</h2>
                </div>
              </div>

              {/* Bộ Lọc */}
              <div className="mb-4 flex flex-wrap items-center gap-2.5 text-xs">
                <select
                  value={filterPlayer}
                  onChange={(e) => setFilterPlayer(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="all">Tất cả người chơi</option>
                  {playersList.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 font-bold">
                  {(["all", "win", "lose"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFilterResult(opt)}
                      className={`px-3 py-1 rounded-md transition ${
                        filterResult === opt ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500"
                      }`}
                    >
                      {opt === "all" ? "Tất cả" : opt === "win" ? "Thắng" : "Thua"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                      <th className="py-3 px-3">Thời Gian</th>
                      <th className="py-3 px-3">Người Chơi</th>
                      <th className="py-3 px-3">Kết Quả</th>
                      <th className="py-3 px-3 text-right">LP Biến Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                    {filteredRecords.slice(0, 10).map((rec, i) => (
                      <tr key={rec.id || i} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 text-slate-400 font-medium">
                          {new Date(rec.created_at).toLocaleString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-800">{rec.player_name}</td>
                        <td className="py-3 px-3">
                          {rec.result === "win" ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                              THẮNG
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                              THUA
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-black">
                          {rec.result === "win" ? (
                            <span className="text-emerald-600">+{rec.elo_change || (rec.wins_count || 1) * 22} LP</span>
                          ) : (
                            <span className="text-rose-600">{rec.elo_change || -((rec.loss_count || 1) * 18)} LP</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes welcomeFade {
          0% { opacity: 0; transform: translate(-50%, -15px) scale(0.95); }
          15%, 80% { opacity: 1; transform: translate(-50%, 0) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -10px) scale(0.98); }
        }

        @keyframes toastIn {
          0% { opacity: 0; transform: translate3d(20px, 0, 0); }
          100% { opacity: 1; transform: translate3d(0, 0, 0); }
        }

        .animate-welcomeFade {
          animation: welcomeFade 3.5s ease-out forwards;
        }

        .animate-toastIn {
          animation: toastIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}