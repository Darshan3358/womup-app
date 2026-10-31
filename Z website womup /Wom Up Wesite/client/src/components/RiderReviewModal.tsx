import React, { useState } from 'react';
import { X, Star, Heart, CheckCircle2 } from 'lucide-react';
import { API_BASE } from '../services/api';

export interface RiderInfo {
  id: string;
  name: string;
  photo?: string;
  vehicleNumber?: string;
  averageRating?: number;
  totalReviews?: number;
}

interface RiderReviewModalProps {
  isOpen: boolean;
  orderId: string;
  orderNumber: string;
  rider: RiderInfo;
  onClose: () => void;
  onSubmitted?: (stars: number, data?: any) => void;
}

const TAGS = [
  { id: 'fast', label: '⚡ Fast Delivery' },
  { id: 'polite', label: '😊 Polite & Courteous' },
  { id: 'on_time', label: '⏰ On Time' },
  { id: 'well_packed', label: '📦 Handled with Care' },
  { id: 'professional', label: '👍 Professional Handover' },
];

const TIP_OPTIONS = [0, 10, 20, 30, 50];

export const RiderReviewModal: React.FC<RiderReviewModalProps> = ({
  isOpen,
  orderId,
  orderNumber,
  rider,
  onClose,
  onSubmitted,
}) => {
  const [stars, setStars] = useState(5);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['fast', 'polite']);
  const [tipAmount, setTipAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async () => {
    if (stars === 0) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `${API_BASE}/orders/${encodeURIComponent(orderId)}/rate-rider`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            stars,
            comment: comment.trim(),
            tags: selectedTags,
            tipAmount,
          }),
        }
      );

      const json = await res.json();
      if (res.ok && json.success) {
        onSubmitted?.(stars, json.data);
        onClose();
      } else {
        alert(json.message || 'Could not submit rating. Please try again.');
      }
    } catch (err: any) {
      console.error('Failed to submit rating:', err);
      alert('Failed to submit rating. Please check your network.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const effectiveStar = hoveredStar || stars;

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition"
        >
          <X size={18} />
        </button>

        {/* Rider Avatar */}
        <div className="flex justify-center mb-2 relative">
          <div className="relative">
            {rider.photo ? (
              <img
                src={rider.photo}
                alt={rider.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-purple-600 shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center text-3xl border-4 border-purple-600 shadow-md">
                🛵
              </div>
            )}
            <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5">
              <CheckCircle2 size={18} className="text-emerald-500 fill-white" />
            </div>
          </div>
        </div>

        <p className="text-center text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">
          Order #{orderNumber}
        </p>
        <h2 className="text-2xl font-extrabold text-slate-900 text-center">
          How was your delivery?
        </h2>
        <p className="text-center text-purple-600 font-bold mt-1 text-base">
          {rider.name || 'DARSHAN THANKI'}
        </p>
        <p className="text-center text-slate-500 text-xs mt-0.5 font-medium">
          {rider.vehicleNumber || 'GJ AE 2020'} • ⭐ {rider.averageRating || 4.88} ({rider.totalReviews || 128} reviews)
        </p>

        {/* Stars Selector */}
        <div className="flex justify-center gap-2 mt-5">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onMouseEnter={() => setHoveredStar(s)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setStars(s)}
              className="p-1 transition-transform hover:scale-110 active:scale-95 focus:outline-none"
            >
              <Star
                size={38}
                fill={s <= effectiveStar ? '#F59E0B' : 'transparent'}
                stroke={s <= effectiveStar ? '#F59E0B' : '#CBD5E1'}
                strokeWidth={2}
              />
            </button>
          ))}
        </div>

        <p className="text-center text-sm font-bold text-slate-700 mt-2">
          {effectiveStar === 0
            ? 'Tap to rate'
            : effectiveStar === 1
            ? '😞 Poor Delivery'
            : effectiveStar === 2
            ? '😐 Below Expectations'
            : effectiveStar === 3
            ? '🙂 Good Experience'
            : effectiveStar === 4
            ? '😊 Very Good Handover'
            : '🤩 Outstanding & Fast!'}
        </p>

        {/* Quick Feedback Tags */}
        <div className="flex flex-wrap gap-2 justify-center mt-4">
          {TAGS.map((tag) => {
            const isActive = selectedTags.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                  isActive
                    ? 'bg-purple-100 border-purple-500 text-purple-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {tag.label}
              </button>
            );
          })}
        </div>

        {/* Comment Box */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add feedback for delivery partner (optional)..."
          maxLength={200}
          rows={2}
          className="w-full mt-4 p-3 border border-slate-200 rounded-2xl text-xs resize-none focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none bg-slate-50/50"
        />

        {/* Tip Row */}
        <div className="mt-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Heart size={14} className="text-red-500 fill-red-500" />
            <p className="text-xs font-bold text-slate-800">
              Add a tip for your partner <span className="text-slate-400 font-normal">(100% to rider)</span>
            </p>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {TIP_OPTIONS.map((amt) => {
              const isActive = tipAmount === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTipAmount(amt)}
                  className={`py-2 rounded-xl text-xs font-extrabold border transition text-center ${
                    isActive
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {amt === 0 ? 'No tip' : `₹${amt}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={stars === 0 || isSubmitting}
          className={`w-full mt-5 py-3.5 rounded-2xl font-extrabold text-white text-sm shadow-md transition ${
            stars === 0 || isSubmitting
              ? 'bg-slate-300 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 active:scale-[0.99]'
          }`}
        >
          {isSubmitting ? (
            'Submitting...'
          ) : tipAmount > 0 ? (
            `Submit Rating & Tip ₹${tipAmount}`
          ) : (
            'Submit Rating'
          )}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-2 py-1.5 text-slate-400 text-xs font-semibold hover:text-slate-600 transition"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
};

export default RiderReviewModal;
