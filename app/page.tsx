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
  PieChart as PieChartIcon,
  Percent,
  Swords,
  Skull,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface MatchRecord {
  id?: string;
  player_name: string;
  result: "win" | "lose";
  loss_count: number;
  created_at: string;
}

const COLORS = ["#10b981", "#f43f5e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"];

export default function ChaoLuaDashboard() {
  const [playerName, setPlayerName] = useState("");
  const [result, setResult] = useState<"win" | "lose">("win");
  const [lossCount, setLossCount] = useState<number>(1);
  const [records, setRecords] = useState<MatchRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from("match_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Lỗi lấy dữ liệu:", error);
      } else if (data) {
        setRecords(data as MatchRecord[]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    setIsSubmitting(true);
    const formattedName =
      playerName.trim().charAt(0).toUpperCase() +
      playerName.trim().slice(1).toLowerCase();

    const newRecord = {
      player_name: formattedName,
      result: result,
      loss_count: result === "lose" ? Number(lossCount) : 0,
    };

    const { data, error } = await supabase
      .from("match_logs")
      .insert([newRecord])
      .select();

    if (error) {
      alert(`Lỗi lưu dữ liệu: ${error.message}`);
    } else if (data) {
      fetchRecords();
      setPlayerName("");
      setResult("win");
      setLossCount(1);
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
        stats[r.player_name].wins += 1;
        stats[r.player_name].totalMatches += 1;
      } else {
        const losses = r.loss_count || 1;
        stats[r.player_name].losses += losses;
        stats[r.player_name].totalMatches += losses;
      }
    });

    // Tính % Thắng
    Object.values(stats).forEach((player) => {
      player.winRate =
        player.totalMatches > 0
          ? Math.round((player.wins / player.totalMatches) * 100)
          : 0;
    });

    return Object.values(stats);
  };

  // Sắp xếp Bảng xếp hạng theo % Thắng (nếu bằng % thì so sánh số trận thắng)
  const getLeaderboardData = () => {
    return getPlayerStats().sort(
      (a, b) => b.winRate - a.winRate || b.wins - a.wins
    );
  };

  // Lấy dữ liệu cho Biểu đồ Tròn (% Đóng góp Thắng)
  const getPieChartData = () => {
    return getPlayerStats()
      .filter((p) => p.wins > 0)
      .map((p) => ({
        name: p.name,
        value: p.wins,
      }));
  };

  // Thống kê nhanh ở Top Cards
  const leaderboard = getLeaderboardData();
  const topPlayer = leaderboard.length > 0 ? leaderboard[0] : null;
  const mostLossPlayer = [...leaderboard].sort((a, b) => b.losses - a.losses)[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-500 p-2.5 rounded-xl text-white shadow-md shadow-orange-200">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Chảo Lửa Hàng Tuần
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Xếp Hạng & Biểu Đồ % Thắng Custom LMHT
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full text-amber-700 text-xs font-semibold">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Mùa Giải 2026</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* 3 THẺ THỐNG KÊ NHANH (CARDS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Swords className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Tổng Trận Đã Đánh</p>
              <p className="text-2xl font-black text-slate-800">
                {records.reduce((acc, r) => acc + (r.result === "win" ? 1 : r.loss_count || 1), 0)} Trận
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Vua Chảo Lửa (% Cao Nhất)</p>
              <p className="text-xl font-black text-emerald-600">
                {topPlayer ? `${topPlayer.name} (${topPlayer.winRate}%)` : "Chưa có"}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
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
            {/* Form Nhập */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-5">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">Báo Cáo Trận Đấu</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Tên của bạn
                  </label>
                  <div className="relative">
                    <UserCheck className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="VD: Quang, Đông, Khang..."
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Kết quả hôm nay
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setResult("win")}
                      className={`py-2.5 px-4 rounded-xl text-sm font-bold border transition-all flex items-center justify-center space-x-2 ${
                        result === "win"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span>🏆 Thắng</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setResult("lose")}
                      className={`py-2.5 px-4 rounded-xl text-sm font-bold border transition-all flex items-center justify-center space-x-2 ${
                        result === "lose"
                          ? "bg-rose-50 border-rose-500 text-rose-700 shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span>💔 Thua</span>
                    </button>
                  </div>
                </div>

                {result === "lose" && (
                  <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100">
                    <label className="block text-xs font-bold uppercase tracking-wider text-rose-700 mb-1.5">
                      Số trận thua hôm nay
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      required
                      value={lossCount}
                      onChange={(e) => setLossCount(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-2 bg-white border border-rose-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-blue-200 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? "Đang gửi..." : "Gửi Kết Quả"}</span>
                </button>
              </form>
            </div>

            {/* BẢNG XẾP HẠNG % THẮNG THUA */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
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
                        <div className="flex items-center space-x-1 font-black text-sm text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                          <Percent className="w-3.5 h-3.5" />
                          <span>{player.winRate}%</span>
                        </div>
                      </div>

                      {/* Thanh phần trăm winrate */}
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
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-6">
                <BarChart3 className="w-5 h-5 text-blue-600" />
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

            {/* BIỂU ĐỒ TRÒN (% THẮNG CỦA CẢ NHÓM) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-6">
                <PieChartIcon className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">
                  Tỷ Lệ Đóng Góp Trận Thắng Nhóm
                </h2>
              </div>

              <div className="h-64 w-full">
                {isMounted && getPieChartData().length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getPieChartData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                      >
                        {getPieChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                    {isMounted ? "Chưa có trận thắng nào" : "Đang tải..."}
                  </div>
                )}
              </div>
            </div>

            {/* LỊCH SỬ NHẬP */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-4">
                <History className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">Lịch Sử Nhập Gần Đây</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">Thời Gian</th>
                      <th className="py-3 px-4">Người Chơi</th>
                      <th className="py-3 px-4">Kết Quả</th>
                      <th className="py-3 px-4 text-right">Trận Thua</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {records.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400">
                          Chưa có nhật ký nào được ghi nhận.
                        </td>
                      </tr>
                    ) : (
                      records.slice(0, 10).map((rec, i) => (
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
                            {rec.result === "lose" ? (
                              <span className="text-rose-600">-{rec.loss_count}</span>
                            ) : (
                              <span className="text-slate-300">0</span>
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
    </div>
  );
}