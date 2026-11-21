import type { PeriodComparisonHabit } from "../types/dashboard";

const recommendations: Record<string, { progress: string; priority: string }> = {
  "Bangun Pagi": {
    priority:
      "Lakukan check-in kehadiran pagi secara konsisten bersama wali kelas, sepakati pengingat kesiapan pada malam sebelumnya, dan evaluasi hambatan siswa untuk datang tepat waktu. Tindak lanjut dilakukan suportif tanpa memberi label pada siswa.",
    progress:
      "Jaga konsistensi melalui apresiasi ringan di kelas dan kaitkan kesiapan pagi dengan fokus belajar pada jam pertama.",
  },
  Beribadah: {
    priority:
      "Fasilitasi pembiasaan spiritual yang terstruktur dan inklusif sesuai keyakinan siswa, disertai refleksi singkat tanpa tekanan kaku.",
    progress:
      "Pertahankan kesinambungan rutinitas dan penguatan nilai tanggung jawab moral dengan menghormati keberagaman keyakinan.",
  },
  Berolahraga: {
    priority:
      "Variasikan aktivitas fisik ringan di sekolah maupun rumah, jadwalkan sesi gerak bersama berkala, dan identifikasi kelompok yang paling minim aktivitas.",
    progress:
      "Pertahankan ritme bergerak secara teratur dan hubungkan kebugaran dengan kesiapan konsentrasi belajar.",
  },
  "Makan Sehat dan Bergizi": {
    priority:
      "Berikan edukasi praktis tentang sarapan bergizi dan asupan seimbang yang terjangkau, lalu telusuri hambatan seperti waktu pagi atau kebiasaan melewatkan sarapan.",
    progress:
      "Pertahankan kebiasaan sarapan atau bekal sehat yang realistis dan dorong berbagi contoh baik antarsiswa.",
  },
  "Gemar Belajar": {
    priority:
      "Dorong pola belajar singkat dan konsisten, seperti target membaca atau catatan harian, serta diskusi kelompok terarah. Identifikasi hambatan belajar dan topik yang memerlukan dukungan.",
    progress:
      "Perkuat budaya berbagi catatan dan diskusi antarteman di luar jam pelajaran dengan tetap menjaga keseimbangan waktu.",
  },
  Bermasyarakat: {
    priority:
      "Hidupkan kegiatan kolaboratif berskala kecil, seperti menjaga kebersihan bersama, saling membantu tugas kelas, atau aksi peduli lingkungan sekitar.",
    progress:
      "Lanjutkan keterlibatan aktif dalam kerja sama tim dan kegiatan sosial sambil menjaga keseimbangan dengan waktu belajar.",
  },
  "Tidur Cepat": {
    priority:
      "Ajak siswa menyepakati jam tenang gawai menjelang tidur, kurangi begadang karena gawai atau tugas menumpuk, lalu pantau dampaknya pada checkpoint berikutnya.",
    progress:
      "Pertahankan waktu istirahat yang cukup dan kebiasaan mengelola gawai sebagai pemulihan energi untuk aktivitas pagi.",
  },
};

export function recommendationForComparison(
  habit: PeriodComparisonHabit | undefined,
): string {
  if (!habit || habit.fromScore === null || habit.toScore === null) return "";
  const guidance = recommendations[habit.habit];
  if (!guidance) return "";
  const needsSupport =
    habit.direction === "down" ||
    (habit.toScore !== null && habit.toScore < 3);
  return needsSupport ? guidance.priority : guidance.progress;
}
