export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-extrabold text-sky-400 mb-4 tracking-tight">
          ⚡ ScisPhy — Backend Core Online
        </h1>
        <p className="text-slate-300 text-lg mb-8">
          Ngân hàng câu hỏi & Cỗ máy tạo đề thi Vật lý chuẩn chương trình GDPT 2018 (K10, K11, K12).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-slate-800/80 rounded-xl border border-slate-700">
            <h2 className="text-xl font-bold text-sky-300 mb-2">📁 API Cây mục lục</h2>
            <p className="text-slate-400 text-sm mb-4">
              Phân cấp Khối 10, 11, 12, Chương, Bài và đếm số lượng câu hỏi.
            </p>
            <code className="text-xs bg-slate-950 p-2 rounded block text-emerald-400">
              GET /api/taxonomy
            </code>
          </div>
          <div className="p-6 bg-slate-800/80 rounded-xl border border-slate-700">
            <h2 className="text-xl font-bold text-sky-300 mb-2">🔍 API Ngân hàng câu hỏi</h2>
            <p className="text-slate-400 text-sm mb-4">
              Lọc theo 4 mức độ nhận thức, 4 dạng thức 2025, tìm kiếm và phân trang.
            </p>
            <code className="text-xs bg-slate-950 p-2 rounded block text-emerald-400">
              GET /api/questions?grade=12&difficulty=1
            </code>
          </div>
        </div>
      </div>
    </main>
  );
}
