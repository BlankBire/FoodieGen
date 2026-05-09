import React, { useState, useEffect } from 'react';
import { Download, Edit2, Trash2, X, Check, FileText } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface DraftListPopoverProps {
  currentProjectId: string;
  onLoadDraft: (draftConfig: any, projectId: string, scriptId: string) => void;
  onClose: () => void;
  showToast: (msg: string) => void;
  onDraftsUpdated?: () => void;
  onDeleteDraft?: (deletedProjectId: string) => void;
}

export const DraftListPopover = ({ currentProjectId, onLoadDraft, onClose, showToast, onDraftsUpdated, onDeleteDraft }: DraftListPopoverProps) => {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/projects/draft`);
      const data = await res.json();
      if (data.success && data.data) {
        setDrafts(data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Không thể tải danh sách bản nháp');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản nháp này?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/projects/draft?projectId=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast('Đã xóa bản nháp');
        setDrafts(prev => prev.filter(d => d.id !== id));
        if (onDraftsUpdated) onDraftsUpdated();
        if (onDeleteDraft) onDeleteDraft(id);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast(`Xóa thất bại: ${err.message}`);
    }
  };

  const handleRenameSubmit = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/projects/draft`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id, newTitle: editTitle })
      });
      const data = await res.json();
      if (data.success) {
        setDrafts(prev => prev.map(d => d.id === id ? { ...d, title: editTitle } : d));
        setEditingId(null);
        showToast('Đã đổi tên bản nháp');
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast(`Đổi tên thất bại: ${err.message}`);
    }
  };

  const handleLoad = (draft: any) => {
    try {
      if (!draft.scripts || draft.scripts.length === 0) {
        showToast('Bản nháp này không có dữ liệu kịch bản.');
        return;
      }
      
      const scriptData = draft.scripts[0];
      const parsedContent = JSON.parse(scriptData.content || '{}');
      if (!parsedContent.config) {
        showToast('Dữ liệu bản nháp không hợp lệ.');
        return;
      }

      onLoadDraft(parsedContent.config, draft.id, scriptData.id);
      showToast(`Đã nạp bản nháp: ${draft.title}`);
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi nạp bản nháp.');
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: 'calc(100% + 12px)',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '460px',
      maxHeight: '360px',
      backgroundColor: 'var(--bg-glass)',
      backdropFilter: 'blur(25px)',
      WebkitBackdropFilter: 'blur(25px)',
      border: '1px solid var(--border-accent)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-card)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-default)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(var(--text-primary), 0.03)'
      }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Danh sách bản lưu</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Bấm vào một bản lưu để nạp lại, đổi tên hoặc xóa.</p>
        </div>
        <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '4px', cursor: 'pointer', background: 'none', border: 'none' }}>
          <X size={18} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Đang tải danh sách...</div>
        ) : drafts.length === 0 ? (
          <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={32} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
            <p style={{ fontSize: '13px' }}>Chưa có bản nháp nào được lưu.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {drafts.map(draft => {
              const isCurrent = draft.id === currentProjectId;
              
              return (
                <div 
                  key={draft.id}
                  style={{
                    backgroundColor: isCurrent ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg-surface)',
                    border: `1px solid ${isCurrent ? 'var(--amber-500)' : 'var(--border-default)'}`,
                    borderRadius: '8px',
                    padding: '12px',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  {isCurrent && (
                    <span style={{ 
                      position: 'absolute', right: '12px', top: '12px', 
                      fontSize: '11px', fontWeight: 600, color: 'var(--amber-500)' 
                    }}>
                      Đang dùng
                    </span>
                  )}

                  {editingId === draft.id ? (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', paddingRight: isCurrent ? '60px' : 0 }}>
                      <input 
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleRenameSubmit(draft.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        style={{
                          flex: 1,
                          padding: '4px 8px',
                          backgroundColor: 'var(--bg-input)',
                          border: '1px solid var(--border-focus)',
                          borderRadius: '4px',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          fontWeight: 600,
                          outline: 'none'
                        }}
                      />
                      <button onClick={(e) => handleRenameSubmit(draft.id, e)} style={{ color: 'var(--amber-500)', padding: '4px' }}><Check size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} style={{ color: 'var(--text-muted)', padding: '4px' }}><X size={16} /></button>
                    </div>
                  ) : (
                    <h4 style={{ 
                      fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0',
                      paddingRight: isCurrent ? '60px' : 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {draft.title}
                    </h4>
                  )}
                  
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {draft.storyTopic || 'Không có mô tả'}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
                    Cập nhật: {formatDate(draft.updatedAt)}
                  </p>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleLoad(draft)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '4px 10px', fontSize: '12px', fontWeight: 500,
                        backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--amber-500)',
                        border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '16px',
                        cursor: 'pointer'
                      }}
                    >
                      <Download size={12} /> Nạp nháp
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(draft.id);
                        setEditTitle(draft.title);
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '4px 10px', fontSize: '12px', fontWeight: 500,
                        backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)',
                        border: '1px solid var(--border-default)', borderRadius: '16px',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit2 size={12} /> Đổi tên
                    </button>
                    <button 
                      onClick={(e) => handleDelete(draft.id, e)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '4px 10px', fontSize: '12px', fontWeight: 500,
                        backgroundColor: 'rgba(248, 113, 113, 0.1)', color: '#ef4444',
                        border: '1px solid rgba(248, 113, 113, 0.3)', borderRadius: '16px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={12} /> Xóa
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
};
