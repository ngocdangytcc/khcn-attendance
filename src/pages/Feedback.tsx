import React, { useMemo, useState } from 'react';
import { submitFeedback } from '../services/attendanceService';
import { getPublicIP } from '../services/networkService';

const faces = [
  { rating: 5, label: 'Rất hài lòng', emoji: '😄' },
  { rating: 4, label: 'Hài lòng', emoji: '🙂' },
  { rating: 3, label: 'Bình thường', emoji: '😐' },
  { rating: 2, label: 'Không hài lòng', emoji: '🙁' },
  { rating: 1, label: 'Rất không hài lòng', emoji: '😡' },
];

const FeedbackPage: React.FC = () => {
  const qs = useMemo(() => new URLSearchParams(window.location.search), []);
  const employeeId = qs.get('emp') || '';
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErr(null);

    if (!employeeId) {
      setErr('Thiếu mã nhân viên (emp). Vui lòng quét lại QR.');
      return;
    }
    if (!rating) {
      setErr('Vui lòng chọn một mức đánh giá.');
      return;
    }

    setBusy(true);
    try {
      let ip = '';
      try { ip = await getPublicIP(); } catch {}

      await submitFeedback({
        employeeId,
        rating,
        comment: comment.trim(),
        ip,
        userAgent: navigator.userAgent,
      });

      setSubmitted(true);
    } catch (e: any) {
      setErr(e?.message || 'Không gửi được đánh giá. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-md w-full text-center space-y-3">
          <div className="text-5xl">🙏</div>
          <h1 className="text-xl font-bold text-gray-900">Cảm ơn anh/chị!</h1>
          <p className="text-sm text-gray-600">
            Ý kiến của anh/chị giúp Phòng KHCN cải thiện chất lượng phục vụ.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-md w-full space-y-4">
        <h1 className="text-lg font-bold text-gray-900">Đánh giá phục vụ</h1>
        <p className="text-sm text-gray-600">
          Mã nhân viên: <span className="font-semibold">{employeeId || '(không có)'}</span>
        </p>

        <div className="grid grid-cols-5 gap-2">
          {faces.map((f) => (
            <button
              key={f.rating}
              onClick={() => setRating(f.rating)}
              className={`p-3 rounded-xl border text-center active:scale-95 transition ${
                rating === f.rating ? 'border-brand-600 bg-brand-50' : 'border-gray-200 bg-white'
              }`}
              title={f.label}
            >
              <div className="text-2xl">{f.emoji}</div>
              <div className="text-[10px] mt-1 text-gray-600">{f.rating}</div>
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Góp ý thêm (không bắt buộc)…"
          className="w-full min-h-[90px] p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />

        {err && <div className="text-sm text-red-600">{err}</div>}

        <button
          onClick={handleSubmit}
          disabled={busy}
          className="w-full bg-brand-600 text-white rounded-xl py-3 font-semibold disabled:opacity-50"
        >
          {busy ? 'Đang gửi...' : 'Gửi đánh giá'}
        </button>

        <p className="text-[11px] text-gray-500">
          * Không yêu cầu đăng nhập. Dữ liệu chỉ phục vụ cải tiến chất lượng dịch vụ nội bộ.
        </p>
      </div>
    </div>
  );
};

export default FeedbackPage;
