import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu để khôi phục ứng dụng? Hành động này không thể hoàn tác.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-rose-500 p-8 text-white text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={40} />
              </div>
              <h1 className="text-2xl font-bold mb-2">Đã xảy ra lỗi!</h1>
              <p className="opacity-90 text-sm">Ứng dụng gặp sự cố không mong muốn và không thể hiển thị.</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-xs font-mono text-rose-600 break-words">
                  {this.state.error?.message || 'Lỗi không xác định'}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={20} />
                  Thử tải lại trang
                </button>
                
                <button
                  onClick={this.handleReset}
                  className="w-full py-4 bg-white text-rose-500 border border-rose-100 rounded-2xl font-bold hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={20} />
                  Xóa dữ liệu & Khôi phục
                </button>
              </div>
              
              <p className="text-center text-[10px] text-slate-400">
                Lưu ý: "Xóa dữ liệu" sẽ xóa toàn bộ danh sách người bán và lịch sử đã lưu.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
