"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Trophy,
  Flame,
  UserCheck,
  BarChart3,
  History,
  Send,
  PlusCircle,
  Award,
  Percent,
  Swords,
  Skull,
  CheckCircle2,
  Filter,
  TrendingUp,
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
} from "recharts";

interface MatchRecord {
  id?: string;
  player_name: string;
  result: "win" | "lose";
  wins_count: number;
  loss_count: number;
  created_at: string;
}

interface Player {
  id: string;
  name: string;
}

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

  useEffect(() => {
    setIsMounted(true);
    fetchPlayers();
    fetchRecords();

    const timer = setTimeout(() => setShowWelcomeEffect(false), 4200);
    return () => clearTimeout(timer);
  }, []);

  // Lấy danh sách thành viên cố định từ bảng players
  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Lỗi lấy danh sách thành viên:", error);
      } else if (data) {
        setPlayersList(data as Player[]);
        // Không tự động chọn người đầu tiên - để trống cho người dùng tự chọn
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from("match_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Lỗi lấy dữ liệu trận đấu:", error);
      } else if (data) {
        setRecords(data as MatchRecord[]);
      }
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

    const newRecord = {
      player_name: playerName,
      result,
      wins_count: result === "win" ? Number(matchCount) : 0,
      loss_count: result === "lose" ? Number(matchCount) : 0,
    };

    const { data, error } = await supabase
      .from("match_logs")
      .insert([newRecord])
      .select();

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

  // Tính toán số liệu tổng hợp của từng người chơi
  const getPlayerStats = () => {
    const stats: Record<
      string,
      { name: string; wins: number; losses: number; totalMatches: number; winRate: number }
    > = {};

    records.forEach((r) => {
      if (!stats[r.player_name]) {
        stats[r.player_name] = {
          name: r.player_name,
          wins: 0,
          losses: 0,
          totalMatches: 0,
          winRate: 0,
        };
      }
      if (r.result === "win") {
        const wins = r.wins_count || 1;
        stats[r.player_name].wins += wins;
        stats[r.player_name].totalMatches += wins;
      } else {
        const losses = r.loss_count || 1;
        stats[r.player_name].losses += losses;
        stats[r.player_name].totalMatches += losses;
      }
    });

    Object.values(stats).forEach((player) => {
      player.winRate =
        player.totalMatches > 0
          ? Math.round((player.wins / player.totalMatches) * 100)
          : 0;
    });

    return Object.values(stats);
  };

  const getLeaderboardData = () => {
    return getPlayerStats().sort(
      (a, b) => b.winRate - a.winRate || b.wins - a.wins
    );
  };

  // Dữ liệu cộng dồn (tích lũy) cho biểu đồ Phong Độ Gần Đây
  // Đi từ trận cũ -> mới, mỗi điểm là tổng số thắng/thua tính đến thời điểm đó
  const getCumulativeFormData = () => {
    const sorted = [...records].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    let cumWins = 0;
    let cumLosses = 0;

    const data = sorted.map((r) => {
      const count = r.result === "win" ? r.wins_count || 1 : r.loss_count || 1;
      if (r.result === "win") {
        cumWins += count;
      } else {
        cumLosses += count;
      }
      return {
        label: new Date(r.created_at).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        }),
        "Tổng Thắng": cumWins,
        "Tổng Thua": cumLosses,
      };
    });

    // Chỉ hiển thị 15 điểm gần nhất để biểu đồ không bị rối
    return data.slice(-15);
  };

  // Danh sách trận đã lọc theo người chơi / kết quả cho bảng Lịch Sử Nhập
  const getFilteredRecords = () => {
    return records.filter((r) => {
      const matchPlayer = filterPlayer === "all" || r.player_name === filterPlayer;
      const matchResult = filterResult === "all" || r.result === filterResult;
      return matchPlayer && matchResult;
    });
  };

  const leaderboard = getLeaderboardData();
  const topPlayer = leaderboard.length > 0 ? leaderboard[0] : null;
  const mostLossPlayer = [...leaderboard].sort((a, b) => b.losses - a.losses)[0];
  const cumulativeFormData = getCumulativeFormData();
  const filteredRecords = getFilteredRecords();

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-pink-50 via-purple-50 to-sky-100 text-slate-800 font-sans pb-12">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-40 h-96 w-96 rounded-full bg-orange-300/25 blur-3xl" />
        <div className="absolute -right-32 top-72 h-96 w-96 rounded-full bg-indigo-300/25 blur-3xl" />
        <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-300/20 blur-3xl" />
      </div>

      {/* Welcome banner effect - centered on screen for readability */}
      {showWelcomeEffect && (
        <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center overflow-hidden">
          <div className="animate-welcomeFade rounded-3xl border border-amber-200 bg-white/95 px-10 py-8 text-center shadow-2xl shadow-amber-500/20 backdrop-blur-xl">
            <div className="mb-2 text-5xl">🔥</div>
            <p className="text-sm font-black uppercase tracking-[0.35em] text-amber-600 sm:text-base">
              Chào mừng đến Chảo Lửa
            </p>
          </div>
          {Array.from({ length: 28 }, (_, i) => (
            <span
              key={i}
              className="falling-star"
              style={{
                left: `${(i * 37) % 101}%`,
                animationDelay: `${(i * 0.13) % 2.6}s`,
                animationDuration: `${2.4 + ((i * 17) % 18) / 10}s`,
                transform: `rotate(${35 + ((i * 23) % 70)}deg)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Success toast */}
      {showSuccess && (
        <div className="fixed right-4 top-20 z-[70] w-[calc(100%-2rem)] max-w-sm animate-toastIn">
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200/60 bg-white/95 p-4 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl">
            <div className="rounded-full bg-emerald-100 p-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-black text-slate-900">Đã ghi nhận kết quả! 🎉</p>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                Dữ liệu đã được lưu và bảng xếp hạng đang cập nhật.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/80 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="rounded-xl bg-gradient-to-br from-orange-400 via-amber-500 to-red-500 p-2.5 text-white shadow-lg shadow-orange-500/30">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                Chảo Lửa Hàng Tuần
              </h1>
              <p className="text-xs font-medium text-slate-500 sm:text-sm">
                Xếp Hạng & Biểu Đồ % Thắng Custom LMHT
              </p>
            </div>
          </div>
          <div className="hidden items-center space-x-2 rounded-full border border-amber-300/40 bg-amber-100/70 px-3 py-1.5 text-xs font-semibold text-amber-700 sm:flex">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Mùa Giải 2026</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl space-y-8 px-4 pt-8 sm:px-6 lg:px-8">
        {/* 3 THẺ THỐNG KÊ NHANH (CARDS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="group rounded-2xl border border-white/70 bg-white/95 p-5 shadow-xl shadow-slate-950/10 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-950/20 flex items-center space-x-4">
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
              <Swords className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Tổng Trận Đã Đánh</p>
              <p className="text-2xl font-black text-slate-800">
                {records.reduce((acc, r) => acc + (r.result === "win" ? r.wins_count || 1 : r.loss_count || 1), 0)} Trận
              </p>
            </div>
          </div>

          <div className="group rounded-2xl border border-white/70 bg-white/95 p-5 shadow-xl shadow-slate-950/10 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-950/20 flex items-center space-x-4">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Vua Chảo Lửa (% Cao Nhất)</p>
              <p className="text-xl font-black text-emerald-600">
                {topPlayer ? `${topPlayer.name} (${topPlayer.winRate}%)` : "Chưa có"}
              </p>
            </div>
          </div>

          <div className="group rounded-2xl border border-white/70 bg-white/95 p-5 shadow-xl shadow-slate-950/10 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-950/20 flex items-center space-x-4">
            <div className="rounded-xl bg-rose-50 p-3 text-rose-600">
              <Skull className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Thua Nhiều Nhất</p>
              <p className="text-xl font-black text-rose-600">
                {mostLossPlayer ? `${mostLossPlayer.name} (${mostLossPlayer.losses} trận)` : "Chưa có"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* CỘT TRÁI: FORM NHẬP KẾT QUẢ & BẢNG XẾP HẠNG (5 Cột) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Form Nhập dạng Select */}
            <div className="rounded-2xl border border-white/70 bg-white/95 p-6 shadow-xl shadow-slate-950/10 backdrop-blur transition-all duration-300 hover:shadow-2xl hover:shadow-slate-950/15">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-5">
                <PlusCircle className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">Báo Cáo Trận Đấu</h2>
              </div>

           <form onSubmit={handleSubmit} className="space-y-4">
  {/* Chọn tên người chơi */}
  <div>
    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
      Chọn tên người chơi
    </label>
    <div className="relative">
      <UserCheck className="w-5 h-5 text-slate-400 absolute left-3 top-3.5 z-10" />
      <select
        required
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition appearance-none cursor-pointer"
      >
        {playersList.length === 0 ? (
          <option value="">Đang tải danh sách...</option>
        ) : (
          <>
            <option value="" disabled>
              -- Chọn người chơi --
            </option>
            {playersList.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </>
        )}
      </select>
    </div>
    <p className="text-[11px] text-slate-400 mt-1 italic">
      *Tên được quản lý cố định từ hệ thống.
    </p>
  </div>

  {/* Chọn kết quả: Thắng / Thua cân đối */}
  <div>
    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
      Kết quả trận đấu
    </label>
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => setResult("win")}
        className={`py-3 px-4 rounded-xl text-sm font-bold border transition-all flex items-center justify-center space-x-2 ${
          result === "win"
            ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200"
            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
        }`}
      >
        <span>🏆 Thắng</span>
      </button>
      <button
        type="button"
        onClick={() => setResult("lose")}
        className={`py-3 px-4 rounded-xl text-sm font-bold border transition-all flex items-center justify-center space-x-2 ${
          result === "lose"
            ? "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-200"
            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
        }`}
      >
        <span>💔 Thua</span>
      </button>
    </div>
  </div>

  {/* Nhập số trận: Thắng / Thua dùng chung một giao diện */}
  <div
    className={`p-4 rounded-xl border space-y-2 animate-fadeIn ${
      result === "win" ? "bg-emerald-50/60 border-emerald-200" : "bg-rose-50/60 border-rose-200"
    }`}
  >
    <label
      className={`block text-xs font-bold uppercase tracking-wider ${
        result === "win" ? "text-emerald-700" : "text-rose-700"
      }`}
    >
      {result === "win" ? "Số trận thắng" : "Số trận thua liên tiếp hôm nay"}
    </label>
    <div className="flex items-center space-x-3">
      <input
        type="number"
        min={1}
        max={10}
        required
        value={matchCount}
        onChange={(e) => setMatchCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
        className={`w-full px-4 py-2.5 bg-white rounded-xl text-slate-900 font-bold text-sm shadow-sm focus:outline-none focus:ring-2 ${
          result === "win"
            ? "border border-emerald-300 focus:ring-emerald-500"
            : "border border-rose-300 focus:ring-rose-500"
        }`}
      />
      <span
        className={`text-xs font-bold whitespace-nowrap ${
          result === "win" ? "text-emerald-600" : "text-rose-600"
        }`}
      >
        trận
      </span>
    </div>
  </div>

  <button
    type="submit"
    disabled={isSubmitting}
    className="w-full mt-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 hover:from-indigo-500 hover:via-violet-500 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center space-x-2 disabled:opacity-50"
  >
    <Send className="w-4 h-4" />
    <span>{isSubmitting ? "Đang gửi..." : "Gửi Kết Quả"}</span>
  </button>
</form>
            </div>

            {/* BẢNG XẾP HẠNG % THẮNG THUA */}
            <div className="rounded-2xl border border-white/70 bg-white/95 p-6 shadow-xl shadow-slate-950/10 backdrop-blur transition-all duration-300 hover:shadow-2xl hover:shadow-slate-950/15">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-4">
                <Award className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-slate-900">Bảng Xếp Hạng % Thắng</h2>
              </div>
              <div className="space-y-3">
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">Chưa có dữ liệu</p>
                ) : (
                  leaderboard.map((player, idx) => (
                    <div
                      key={player.name}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                              idx === 0
                                ? "bg-amber-400 text-white"
                                : idx === 1
                                ? "bg-slate-300 text-white"
                                : idx === 2
                                ? "bg-amber-700 text-white"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-800 text-sm">
                            {player.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 font-black text-sm text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                          <Percent className="w-3.5 h-3.5" />
                          <span>{player.winRate}%</span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${player.winRate}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between text-xs text-slate-500 pt-1 font-medium">
                        <span>Tổng: {player.totalMatches} trận</span>
                        <span>
                          <strong className="text-emerald-600">{player.wins}W</strong> -{" "}
                          <strong className="text-rose-600">{player.losses}L</strong>
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: 2 BIỂU ĐỒ & LỊCH SỬ (7 Cột) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* BIỂU ĐỒ CỘT THẮNG / THUA */}
            <div className="rounded-2xl border border-white/70 bg-white/95 p-6 shadow-xl shadow-slate-950/10 backdrop-blur transition-all duration-300 hover:shadow-2xl hover:shadow-slate-950/15">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-6">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">
                  Biểu Đồ Thắng vs Thua
                </h2>
              </div>

              <div className="h-64 w-full">
                {isMounted && getPlayerStats().length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getPlayerStats()}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 13, fontWeight: 600 }}
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
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: "10px" }} />
                      <Bar dataKey="wins" name="Số Trận Thắng" fill="#10b981" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="losses" name="Số Trận Thua" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                    {isMounted ? "Chưa có dữ liệu" : "Đang tải biểu đồ..."}
                  </div>
                )}
              </div>
            </div>

            {/* PHONG ĐỘ GẦN ĐÂY - dạng cộng dồn */}
            <div className="rounded-2xl border border-white/70 bg-white/95 p-6 shadow-xl shadow-slate-950/10 backdrop-blur transition-all duration-300 hover:shadow-2xl hover:shadow-slate-950/15">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-bold text-slate-900">Phong Độ Gần Đây</h2>
                </div>
                <span className="text-xs font-semibold text-slate-400">Cộng dồn 15 lượt gần nhất</span>
              </div>

              <div className="h-64 w-full">
                {isMounted && cumulativeFormData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={cumulativeFormData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
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
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: "10px" }} />
                      <Line
                        type="monotone"
                        dataKey="Tổng Thắng"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 3, fill: "#10b981" }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Tổng Thua"
                        stroke="#f43f5e"
                        strokeWidth={3}
                        dot={{ r: 3, fill: "#f43f5e" }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                    {isMounted ? "Chưa có dữ liệu phong độ" : "Đang tải biểu đồ..."}
                  </div>
                )}
              </div>
            </div>

            {/* LỊCH SỬ NHẬP */}
            <div className="rounded-2xl border border-white/70 bg-white/95 p-6 shadow-xl shadow-slate-950/10 backdrop-blur transition-all duration-300 hover:shadow-2xl hover:shadow-slate-950/15">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 flex-wrap gap-3">
                <div className="flex items-center space-x-2">
                  <History className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-bold text-slate-900">Lịch Sử Nhập Gần Đây</h2>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {filteredRecords.length}/{records.length} trận
                </span>
              </div>

              {/* Bộ lọc */}
              <div className="mb-5 flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Lọc</span>
                </div>
                <select
                  value={filterPlayer}
                  onChange={(e) => setFilterPlayer(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">Tất cả người chơi</option>
                  {playersList.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                  {(["all", "win", "lose"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFilterResult(opt)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                        filterResult === opt
                          ? opt === "win"
                            ? "bg-emerald-500 text-white shadow-sm"
                            : opt === "lose"
                            ? "bg-rose-500 text-white shadow-sm"
                            : "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {opt === "all" ? "Tất cả" : opt === "win" ? "Thắng" : "Thua"}
                    </button>
                  ))}
                </div>
                {(filterPlayer !== "all" || filterResult !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterPlayer("all");
                      setFilterResult("all");
                    }}
                    className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 underline underline-offset-2"
                  >
                    Xóa lọc
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">Thời Gian</th>
                      <th className="py-3 px-4">Người Chơi</th>
                      <th className="py-3 px-4">Kết Quả</th>
                      <th className="py-3 px-4 text-right">Số Trận</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400">
                          {records.length === 0
                            ? "Chưa có nhật ký nào được ghi nhận."
                            : "Không có trận nào khớp với bộ lọc."}
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.slice(0, 15).map((rec, i) => (
                        <tr key={rec.id || i} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4 text-xs text-slate-400">
                            {new Date(rec.created_at).toLocaleString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "2-digit",
                            })}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {rec.player_name}
                          </td>
                          <td className="py-3.5 px-4">
                            {rec.result === "win" ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                Thắng
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                                Thua
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-700">
                            {rec.result === "win" ? (
                              <span className="text-emerald-600">+{rec.wins_count || 1}</span>
                            ) : (
                              <span className="text-rose-600">-{rec.loss_count || 1}</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes fallingStar {
          0% {
            opacity: 0;
            transform: translate3d(0, -15vh, 0) rotate(45deg) scale(0.35);
          }
          12% {
            opacity: 1;
          }
          70% {
            opacity: 0.9;
          }
          100% {
            opacity: 0;
            transform: translate3d(-18vw, 115vh, 0) rotate(45deg) scale(1);
          }
        }

        @keyframes welcomeFade {
          0%, 70% { opacity: 0; transform: translateY(-8px) scale(0.96); }
          15%, 55% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-5px) scale(1.02); }
        }

        @keyframes toastIn {
          0% { opacity: 0; transform: translate3d(30px, -10px, 0) scale(0.96); }
          100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }

        .falling-star {
          position: absolute;
          top: -40px;
          width: 3px;
          height: 3px;
          border-radius: 999px;
          background: #fef3c7;
          box-shadow: 0 0 8px 2px rgba(251, 191, 36, 0.9);
          animation-name: fallingStar;
          animation-timing-function: linear;
          animation-iteration-count: 1;
        }

        .falling-star::after {
          content: "";
          position: absolute;
          right: 2px;
          top: 1px;
          width: 55px;
          height: 2px;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(251, 191, 36, 0.7), transparent);
        }

        .animate-welcomeFade {
          animation: welcomeFade 4.1s ease-out forwards;
        }

        .animate-toastIn {
          animation: toastIn 0.35s cubic-bezier(.2,.8,.2,1) forwards;
        }
      `}</style>
    </div>
  );
}