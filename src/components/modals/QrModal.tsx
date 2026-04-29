import { motion } from 'motion/react';
import { QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  copySuccess: boolean;
  handleCopyLink: () => void;
}

export default function QrModal({ isOpen, onClose, copySuccess, handleCopyLink }: QrModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col items-center p-8 text-center"
      >
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
          <QrCode size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Quét Mã QR Để Cài Đặt</h3>
        <p className="text-sm text-slate-500 mb-8">Dùng camera điện thoại quét mã này để mở ứng dụng và cài đặt vào màn hình chính.</p>
        
        <div className="p-4 bg-white border-4 border-slate-50 rounded-2xl shadow-inner mb-6">
          <QRCodeSVG 
            value={process.env.SHARED_APP_URL || process.env.APP_URL || window.location.origin} 
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>

        <div className="mb-6 w-full text-left">
          <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Link Cài Đặt</p>
          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-600 font-medium truncate flex-1">
              {process.env.SHARED_APP_URL || process.env.APP_URL || window.location.origin}
            </span>
            <button 
              onClick={handleCopyLink}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
            >
              {copySuccess ? 'Đã chép!' : 'Sao chép'}
            </button>
          </div>
        </div>

        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 mb-8 text-left">
          <p className="text-[10px] text-amber-700 font-bold uppercase mb-1">Lưu ý lỗi 403/404:</p>
          <p className="text-[10px] text-amber-600 leading-relaxed">
            Nếu quét bị lỗi 403, bạn cần đăng nhập Google trên điện thoại hoặc sử dụng link <b>"Shared App"</b> từ menu AI Studio.
          </p>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
        >
          Đóng
        </button>
      </motion.div>
    </div>
  );
}
