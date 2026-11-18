import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  DashboardSummary,
  HabitKey,
  HabitScore,
} from "../types/dashboard";

function score(value: number | null): string {
  return value === null ? "-" : value.toFixed(2);
}

function drawSectionTitle(doc: jsPDF, title: string, subtitle: string): void {
  doc.setTextColor(34, 49, 74);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(title, 14, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(119, 132, 152);
  doc.text(subtitle, 14, 27);
}

function tableStyles() {
  return {
    theme: "grid" as const,
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [59, 73, 96] as [number, number, number],
      lineColor: [229, 235, 243] as [number, number, number],
    },
    headStyles: {
      fillColor: [68, 91, 207] as [number, number, number],
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: "bold" as const,
    },
    alternateRowStyles: {
      fillColor: [247, 249, 253] as [number, number, number],
    },
    margin: { left: 14, right: 14 },
  };
}

function makeConclusion(summary: DashboardSummary): string[] {
  const statements: string[] = [];

  if (summary.overallIndex === null) {
    statements.push("Belum tersedia data yang cukup untuk menghitung indeks keseluruhan.");
  } else {
    statements.push(
      `Indeks keseluruhan berada pada ${summary.overallIndex.toFixed(2)} dari skala 4,00.`,
    );
  }

  if (summary.highestHabit?.score !== null && summary.highestHabit) {
    statements.push(
      `Kebiasaan dengan skor tertinggi adalah ${summary.highestHabit.habit} (${summary.highestHabit.score.toFixed(2)}).`,
    );
  }
  if (summary.priorityHabit?.score !== null && summary.priorityHabit) {
    statements.push(
      `Prioritas penguatan saat ini adalah ${summary.priorityHabit.habit} (${summary.priorityHabit.score.toFixed(2)}).`,
    );
  }

  const first = summary.trends.find((point) => point.periode === 1);
  const last = summary.trends.find((point) => point.periode === 4);
  if (first && last) {
    const firstScores = Object.values(first.scores).filter(
      (value): value is number => value !== null,
    );
    const lastScores = Object.values(last.scores).filter(
      (value): value is number => value !== null,
    );
    if (firstScores.length && lastScores.length) {
      const start = firstScores.reduce((total, value) => total + value, 0) / firstScores.length;
      const end = lastScores.reduce((total, value) => total + value, 0) / lastScores.length;
      const delta = end - start;
      const direction = delta > 0.005 ? "meningkat" : delta < -0.005 ? "menurun" : "relatif stabil";
      statements.push(
        `Rata-rata tren dari Pengukuran 1 ke 4 ${direction} (${start.toFixed(2)} menjadi ${end.toFixed(2)}).`,
      );
    }
  }

  statements.push(
    "Kesimpulan ini merupakan ringkasan deskriptif dan perlu dibaca bersama konteks kegiatan serta kondisi siswa.",
  );
  return statements;
}

const recommendations: Record<HabitKey, string> = {
  bangunPagi:
    "Susun rutinitas malam dan pagi bersama siswa serta keluarga; evaluasi konsistensi kehadiran dan kesiapan belajar secara suportif.",
  beribadah:
    "Perkuat pembiasaan refleksi dan ibadah yang menghormati keyakinan masing-masing siswa, serta libatkan wali kelas dalam pendampingan.",
  berolahraga:
    "Tambahkan aktivitas fisik ringan dan teratur di kelas atau kegiatan sekolah, lalu pantau partisipasi secara inklusif.",
  makanSehat:
    "Dorong pilihan bekal dan jajanan seimbang, kebiasaan minum air, serta edukasi gizi yang praktis bagi siswa.",
  gemarBelajar:
    "Buat target belajar kecil dan realistis, rutinitas membaca, serta pendampingan teman sebaya untuk menjaga motivasi.",
  bermasyarakat:
    "Perbanyak kegiatan kolaborasi dan kepedulian sosial yang terukur, disertai refleksi pengalaman bersama siswa.",
  tidurCepat:
    "Edukasi kebersihan tidur, jadwal istirahat teratur, dan pengelolaan penggunaan perangkat sebelum tidur.",
};

function makeRecommendations(summary: DashboardSummary): string[] {
  return summary.priorityHabits
    .filter((habit) => habit.score !== null)
    .map(
      (habit) =>
        `${habit.habit} (${habit.score!.toFixed(2)}): ${recommendations[habit.key]}`,
    );
}

function sortedHabits(habits: HabitScore[]): HabitScore[] {
  return [...habits].sort((a, b) => {
    if (a.score === null) return 1;
    if (b.score === null) return -1;
    return b.score - a.score;
  });
}

export function exportDashboardReport(summary: DashboardSummary): void {
  if (summary.dataSource !== "google-sheets") {
    throw new Error("Ekspor laporan hanya tersedia untuk data Google Sheets.");
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const filters = summary.appliedFilters;
  const filterDescription = [
    `Jenjang/rombel: ${filters.kelas ?? "Semua"}`,
    `Jenis kelamin: ${filters.jenisKelamin ?? "Semua"}`,
    `Periode KPI: ${filters.periode ? `Pengukuran ${filters.periode}` : "Semua"}`,
  ].join(" | ");

  doc.setFillColor(36, 52, 94);
  doc.rect(0, 0, pageWidth, 56, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("SMAN 2 CIBINONG  |  SMAVO", 14, 17);
  doc.setFontSize(20);
  doc.text("Laporan Monitoring 7 KAIH", 14, 31);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Dashboard Decision Support System · VERTIKAL SMA 2026", 14, 40);

  doc.setTextColor(48, 62, 84);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Ringkasan eksekutif", 14, 70);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    doc.splitTextToSize(
      `${summary.totalRespondents.toLocaleString("id-ID")} responden · ${summary.totalResponses.toLocaleString("id-ID")} respons item · Indeks ${score(summary.overallIndex)} / 4,00`,
      pageWidth - 28,
    ),
    14,
    78,
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Kesimpulan otomatis", 14, 96);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  let y = 104;
  for (const statement of makeConclusion(summary)) {
    const lines = doc.splitTextToSize(`- ${statement}`, pageWidth - 32);
    doc.text(lines, 16, y);
    y += lines.length * 5 + 2;
  }

  doc.setFont("helvetica", "bold");
  doc.text("Filter yang digunakan", 14, y + 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(doc.splitTextToSize(filterDescription, pageWidth - 28), 14, y + 10);
  y += 22;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(48, 62, 84);
  doc.text("Rekomendasi tindak lanjut", 14, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  y += 7;
  const nextSteps = makeRecommendations(summary);
  if (nextSteps.length === 0) {
    doc.text(
      "Belum ada skor kebiasaan yang cukup untuk menyusun rekomendasi.",
      14,
      y,
    );
  } else {
    for (const recommendation of nextSteps) {
      const lines = doc.splitTextToSize(`- ${recommendation}`, pageWidth - 32);
      if (y + lines.length * 4 + 3 > 265) {
        doc.addPage();
        y = 22;
      }
      doc.text(lines, 16, y);
      y += lines.length * 4 + 3;
    }
  }
  doc.setTextColor(119, 132, 152);
  doc.text(
    "Sumber: Google Sheets. Tren tetap menampilkan 4 checkpoint.",
    14,
    276,
  );

  doc.addPage();
  drawSectionTitle(doc, "Skor kebiasaan", "Urutan berdasarkan skor tertinggi · skala 1,00 sampai 4,00");
  autoTable(doc, {
    ...tableStyles(),
    startY: 34,
    head: [["Peringkat", "Kebiasaan", "Skor rata-rata", "Respons item"]],
    body: sortedHabits(summary.habits).map((habit, index) => [
      String(index + 1),
      habit.habit,
      score(habit.score),
      habit.responseCount.toLocaleString("id-ID"),
    ]),
  });

  doc.addPage();
  drawSectionTitle(doc, "Distribusi jawaban Likert", "Persentase jawaban untuk tiap kategori kebiasaan");
  autoTable(doc, {
    ...tableStyles(),
    startY: 34,
    head: [["Kebiasaan", "Tidak Pernah", "Jarang", "Sering", "Selalu", "Total respons"]],
    body: summary.distribution.map((item) => [
      item.habit,
      `${item.tidakPernah.toFixed(2)}%`,
      `${item.jarang.toFixed(2)}%`,
      `${item.sering.toFixed(2)}%`,
      `${item.selalu.toFixed(2)}%`,
      item.totalResponses.toLocaleString("id-ID"),
    ]),
  });

  doc.addPage();
  drawSectionTitle(doc, "Perbandingan jenjang", "Skor rata-rata per kategori kebiasaan · skala 1,00 sampai 4,00");
  autoTable(doc, {
    ...tableStyles(),
    startY: 34,
    head: [["Kebiasaan", "Kelas X", "Kelas XI", "Kelas XII"]],
    body: summary.gradeComparison.map((item) => [
      item.habit,
      score(item.kelasX),
      score(item.kelasXI),
      score(item.kelasXII),
    ]),
  });

  doc.addPage();
  drawSectionTitle(doc, "Tren empat pengukuran", "Seri tren mempertahankan empat checkpoint yang tersedia");
  autoTable(doc, {
    ...tableStyles(),
    startY: 34,
    head: [["Kebiasaan", "Pengukuran 1", "Pengukuran 2", "Pengukuran 3", "Pengukuran 4"]],
    body: summary.habits.map((habit) => [
      habit.habit,
      ...summary.trends.map((point) => score(point.scores[habit.key])),
    ]),
  });

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(138, 150, 168);
    doc.text("SMAVO · Monitoring 7 KAIH", 14, 287);
    doc.text(`Halaman ${page} dari ${pageCount}`, pageWidth - 14, 287, {
      align: "right",
    });
  }

  const date = new Date().toISOString().slice(0, 10);
  doc.save(`laporan-7-kaih-smavo-${date}.pdf`);
}
