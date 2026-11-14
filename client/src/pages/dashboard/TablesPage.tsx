import React, { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Plus,
  RotateCw,
  Printer,
  Download,
  Trash2,
  X,
  Copy,
  Check,
  ExternalLink,
  Users,
  QrCode,
} from "lucide-react";
import api from "../../utils/api";
import useAuthStore from "../../stores/authStore";

interface TableItem {
  id: string;
  tableNumber: number;
  label?: string;
  qrToken: string;
  capacity: number;
  isActive: boolean;
  _count?: {
    orders: number;
  };
}

export const TablesPage: React.FC = () => {
  const { activeRestaurant } = useAuthStore();
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Table Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [tableNum, setTableNum] = useState("");
  const [tableLabel, setTableLabel] = useState("");
  const [tableCapacity, setTableCapacity] = useState("4");

  // Selected Table for Poster Modal
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Copied URL feedback per table
  const [copiedTableId, setCopiedTableId] = useState<string | null>(null);

  const fetchTables = async () => {
    if (!activeRestaurant) return;
    try {
      setLoading(true);
      const res = await api.get(`/api/tables?restaurantId=${activeRestaurant.id}`);
      setTables(res.data.tables || []);
    } catch (err) {
      console.error("Failed to load tables:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [activeRestaurant?.id]);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRestaurant || !tableNum) return;

    try {
      await api.post("/api/tables", {
        restaurantId: activeRestaurant.id,
        tableNumber: parseInt(tableNum),
        label: tableLabel.trim() || `Table ${tableNum.padStart(2, "0")}`,
        capacity: parseInt(tableCapacity) || 4,
      });

      setTableNum("");
      setTableLabel("");
      setAddModalOpen(false);
      fetchTables();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create table");
    }
  };

  const handleRegenerateToken = async (tableId: string) => {
    if (
      !confirm(
        "Regenerating this QR token will invalidate existing printed posters for this table. Continue?"
      )
    )
      return;

    try {
      await api.patch(`/api/tables/${tableId}/regenerate-token`);
      fetchTables();
    } catch (err) {
      console.error("Failed to regenerate token:", err);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm("Are you sure you want to delete this table?")) return;

    try {
      await api.delete(`/api/tables/${tableId}`);
      fetchTables();
    } catch (err) {
      console.error("Failed to delete table:", err);
    }
  };

  // Copy URL with tactile feedback
  const handleCopyLink = (table: TableItem) => {
    const url = `${window.location.origin}/m/${table.qrToken}`;
    navigator.clipboard.writeText(url);
    setCopiedTableId(table.id);
    setTimeout(() => setCopiedTableId(null), 2500);
  };

  // HTML5 Canvas Table Tent Poster Renderer
  const renderCanvasPoster = (table: TableItem) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 800;
    const height = 1050;
    canvas.width = width;
    canvas.height = height;

    // Background Canvas
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);

    // Decorative top border header band
    ctx.fillStyle = activeRestaurant?.accentColor || "#10B981";
    ctx.fillRect(0, 0, width, 24);

    // Subtle outline border
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Restaurant Name
    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 42px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(activeRestaurant?.name || "The Spice Kitchen", width / 2, 110);

    // Tagline
    ctx.fillStyle = "#64748B";
    ctx.font = "500 20px 'Inter', sans-serif";
    ctx.fillText("Contactless Dining & Instant Ordering", width / 2, 145);

    // Table Badge
    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.roundRect(width / 2 - 120, 180, 240, 56, 16);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 26px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(
      table.label || `TABLE ${String(table.tableNumber).padStart(2, "0")}`,
      width / 2,
      218
    );

    // QR Code Container Box
    ctx.fillStyle = "#F8FAFC";
    ctx.beginPath();
    ctx.roundRect(width / 2 - 210, 270, 420, 420, 28);
    ctx.fill();
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Render QR Code onto Canvas
    const svgElem = document.getElementById(`qr-svg-${table.id}`);

    if (svgElem) {
      const xml = new XMLSerializer().serializeToString(svgElem);
      const svg64 = btoa(xml);
      const image64 = "data:image/svg+xml;base64," + svg64;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, width / 2 - 170, 310, 340, 340);

        // Guest Wi-Fi Pill
        if (activeRestaurant?.wifiPassword) {
          ctx.fillStyle = "#F1F5F9";
          ctx.beginPath();
          ctx.roundRect(width / 2 - 190, 725, 380, 46, 23);
          ctx.fill();

          ctx.fillStyle = "#475569";
          ctx.font = "600 16px 'Inter', sans-serif";
          ctx.fillText(`Guest Wi-Fi Password: ${activeRestaurant.wifiPassword}`, width / 2, 754);
        }

        // Instructions
        ctx.fillStyle = "#0F172A";
        ctx.font = "bold 24px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("Point Phone Camera to View Menu", width / 2, 830);

        ctx.fillStyle = "#64748B";
        ctx.font = "16px 'Inter', sans-serif";
        ctx.fillText("Browse dishes, customize options & order instantly", width / 2, 865);

        // Footer Branding
        ctx.fillStyle = "#94A3B8";
        ctx.font = "500 15px 'Inter', sans-serif";
        ctx.fillText("Powered by Dineeze • Smart Dining Platform", width / 2, 980);
      };
      img.src = image64;
    }
  };

  const handleOpenPoster = (table: TableItem) => {
    setSelectedTable(table);
    setTimeout(() => {
      renderCanvasPoster(table);
    }, 150);
  };

  const downloadPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedTable) return;
    const link = document.createElement("a");
    link.download = `table-${selectedTable.tableNumber}-poster.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const printPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Table Poster</title>
          <style>
            @page { size: auto; margin: 0; }
            body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; }
            img { max-height: 95vh; max-width: 95vw; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <img src="${dataUrl}" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-950">
              Tables & QR Table-Tent Posters
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {tables.length} tables
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate printable high-resolution tabletop QR stands and track dining room assignments.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Table
        </button>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((table) => {
          const qrUrl = `${window.location.origin}/m/${table.qrToken}`;
          const isCopied = copiedTableId === table.id;

          return (
            <div
              key={table.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4 flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div>
                {/* Table Card Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-slate-900 leading-tight">
                      {table.label || `Table ${table.tableNumber}`}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                      <Users className="w-3 h-3 text-slate-400" />
                      Seats {table.capacity} guests
                    </span>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </div>

                {/* QR Code Centerpiece */}
                <div className="my-4 flex justify-center">
                  <div
                    onClick={() => handleOpenPoster(table)}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:border-emerald-500 hover:shadow-md transition group text-center"
                    title="Click to view full printable poster"
                  >
                    <QRCodeSVG
                      id={`qr-svg-${table.id}`}
                      value={qrUrl}
                      size={130}
                      level="H"
                      includeMargin={false}
                    />
                    <span className="text-[10px] text-emerald-600 font-bold block mt-2 group-hover:underline flex items-center justify-center gap-1">
                      <Printer className="w-3 h-3" /> View Print Poster
                    </span>
                  </div>
                </div>

                {/* Token URL & One-Click Copy */}
                <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
                  <span className="text-[10px] font-mono text-slate-500 truncate flex-1 pl-1">
                    /m/{table.qrToken.slice(0, 16)}...
                  </span>
                  <button
                    onClick={() => handleCopyLink(table)}
                    className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-md transition cursor-pointer"
                    title="Copy direct guest ordering URL"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <a
                    href={qrUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-md transition"
                    title="Open customer menu in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Card Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenPoster(table)}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Print Poster</span>
                </button>
                <button
                  onClick={() => handleRegenerateToken(table.id)}
                  className="p-1.5 text-slate-400 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                  title="Regenerate table QR token"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteTable(table.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  title="Delete table"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {tables.length === 0 && !loading && (
          <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 text-sm space-y-3">
            <QrCode className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-800">No dining tables created yet.</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add tables to automatically generate branded QR table-tent posters for your dining room.
            </p>
            <button
              onClick={() => setAddModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white"
            >
              + Add Table
            </button>
          </div>
        )}
      </div>

      {/* Printable Poster Preview Modal */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-display font-bold text-base text-slate-950">
                  {selectedTable.label || `Table ${selectedTable.tableNumber}`} Poster
                </h3>
                <p className="text-xs text-slate-500">
                  300 DPI vector preview ready for standard tabletop acrylic stands.
                </p>
              </div>
              <button
                onClick={() => setSelectedTable(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Canvas Container */}
            <div className="flex justify-center bg-slate-100 p-4 rounded-2xl border border-slate-200 overflow-hidden">
              <canvas
                ref={canvasRef}
                className="max-h-[460px] w-auto shadow-md rounded-lg"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Token: {selectedTable.qrToken.slice(0, 12)}...
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadPoster}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download PNG
                </button>
                <button
                  onClick={printPoster}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Poster
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="relative bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-200 z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-display font-bold text-base text-slate-950">
                Add Dining Table
              </h3>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTable} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Table Number *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={tableNum}
                  onChange={(e) => setTableNum(e.target.value)}
                  placeholder="e.g. 7"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Custom Label (Optional)
                </label>
                <input
                  type="text"
                  value={tableLabel}
                  onChange={(e) => setTableLabel(e.target.value)}
                  placeholder="e.g. Patio Booth 2"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Guest Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={tableCapacity}
                  onChange={(e) => setTableCapacity(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white"
                >
                  Create Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablesPage;
