import { RotateCcw, SlidersHorizontal } from "lucide-react";
import type { DashboardFilters } from "../types/dashboard";

interface FilterBarProps {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
  onReset: () => void;
  classFilterLocked?: boolean;
}

export function FilterBar({
  filters,
  onChange,
  onReset,
  classFilterLocked = false,
}: FilterBarProps) {
  const update = (key: keyof DashboardFilters, value: string) =>
    onChange({ ...filters, [key]: value });

  return (
    <section className="filter-bar panel" aria-label="Filter dashboard">
      <div className="filter-title">
        <span className="filter-icon">
          <SlidersHorizontal size={17} />
        </span>
        <div>
          <strong>Filter data</strong>
          <span>Perbarui tampilan secara langsung</span>
        </div>
      </div>
      <label className="filter-field">
        <span>Jenjang</span>
        <select
          disabled={classFilterLocked}
          value={filters.kelas}
          onChange={(event) => update("kelas", event.target.value)}
        >
          <option value="">Semua jenjang</option>
          <option value="X">Kelas X</option>
          <option value="XI">Kelas XI</option>
          <option value="XII">Kelas XII</option>
        </select>
      </label>
      <label className="filter-field">
        <span>Rombel</span>
        <input
          disabled={classFilterLocked}
          type="text"
          value={filters.rombel}
          onChange={(event) => update("rombel", event.target.value)}
          placeholder="Mis. XI-1"
          aria-label="Filter rombongan belajar"
        />
      </label>
      <label className="filter-field">
        <span>Jenis kelamin</span>
        <select
          value={filters.jenisKelamin}
          onChange={(event) => update("jenisKelamin", event.target.value)}
        >
          <option value="">Semua</option>
          <option value="Laki-laki">Laki-laki</option>
          <option value="Perempuan">Perempuan</option>
          <option value="Tidak diketahui">Tidak diketahui</option>
        </select>
      </label>
      <label className="filter-field">
        <span>Periode</span>
        <select
          value={filters.periode}
          onChange={(event) => update("periode", event.target.value)}
        >
          <option value="">Semua pengukuran</option>
          <option value="1">Pengukuran 1</option>
          <option value="2">Pengukuran 2</option>
          <option value="3">Pengukuran 3</option>
          <option value="4">Pengukuran 4</option>
        </select>
      </label>
      <button className="button-reset" type="button" onClick={onReset}>
        <RotateCcw size={15} />
        Reset
      </button>
      {classFilterLocked ? (
        <span className="filter-hint">
          Data dibatasi ke kelas binaan akun wali kelas.
        </span>
      ) : filters.rombel.trim() ? (
        <span className="filter-hint">
          Rombel spesifik menggantikan pilihan jenjang saat diterapkan.
        </span>
      ) : null}
    </section>
  );
}
