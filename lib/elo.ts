export function calculateMMR(winnerAvgMMR: number, loserAvgMMR: number) {
  const K = 32; // Hệ số nhảy điểm
  const expectedWin = 1 / (1 + Math.pow(10, (loserAvgMMR - winnerAvgMMR) / 400));
  return Math.round(K * (1 - expectedWin)); // Trả về số điểm được cộng
}