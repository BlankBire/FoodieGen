'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  {
    section: 'Tổng quan',
    items: [
      { href: '/', label: 'Dashboard', emoji: '🏠' },
      { href: '/create', label: 'Tạo video', emoji: '✨' },
      { href: '/history', label: 'Lịch sử', emoji: '🎬' },
    ],
  },
  {
    section: 'Cài đặt',
    items: [
      { href: '/templates', label: 'Templates', emoji: '📂' },
      { href: '/settings', label: 'Cài đặt', emoji: '⚙️' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <span style={{ fontSize: '20px' }}>🍽️</span>
        </div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-name">VeoFood</span>
          <span className="sidebar-logo-sub">Studio</span>
        </div>
      </div>

      {/* Navigation */}
      {navItems.map((group) => (
        <div key={group.section} className="sidebar-section">
          <div className="sidebar-section-label">{group.section}</div>
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
            >
              <span className="nav-item-icon" style={{ fontSize: '18px' }}>
                {item.emoji}
              </span>
              <span>{item.label}</span>
              {item.href === '/create' && (
                <span
                  className="badge badge-amber"
                  style={{ marginLeft: 'auto', fontSize: '10px' }}
                >
                  New
                </span>
              )}
            </Link>
          ))}
        </div>
      ))}

      {/* Bottom user card */}
      <div className="sidebar-bottom">
        <div className="user-card">
          <div className="user-avatar">VF</div>
          <div>
            <div className="user-info-name">VeoFood User</div>
            <div className="user-info-plan">✦ Pro Plan</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
