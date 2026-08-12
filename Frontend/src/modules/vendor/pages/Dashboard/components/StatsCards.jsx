import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiBriefcase, FiCheckCircle, FiArrowUp } from 'react-icons/fi';
import { FaWallet, FaRegMoneyBillAlt } from 'react-icons/fa';

const StatsCards = memo(({ stats }) => {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Today's Earnings",
      value: `₹${stats.todayEarnings.toLocaleString()}`,
      icon: FaRegMoneyBillAlt,
      iconBg: 'bg-[#e6f7f5]',
      iconColor: 'text-[#00bfa5]',
      subtitle: (
        <span className="flex items-center text-[#00bfa5] font-semibold text-[11px]">
          <FiArrowUp className="w-3 h-3 mr-0.5" strokeWidth={3} /> 12.5% <span className="text-gray-400 ml-1 font-medium">from yesterday</span>
        </span>
      ),
      onClick: () => navigate('/vendor/wallet'),
    },
    {
      title: 'Pending Alerts',
      value: stats.pendingAlerts,
      icon: FiClock,
      iconBg: 'bg-[#e6f7f5]',
      iconColor: 'text-[#00bfa5]',
      subtitle: <span className="text-gray-400 text-[11px] font-medium">No new alerts</span>,
      onClick: () => navigate('/vendor/booking-alerts'),
    },
    {
      title: 'Active Jobs',
      value: stats.activeJobs,
      icon: FiBriefcase,
      iconBg: 'bg-[#e6f7f5]',
      iconColor: 'text-[#00bfa5]',
      subtitle: <span className="text-gray-400 text-[11px] font-medium">{stats.activeJobs === 0 ? 'No active jobs' : 'All active jobs'}</span>,
      onClick: () => navigate('/vendor/jobs'),
    },
    {
      title: 'Completed Jobs',
      value: stats.completedJobs,
      icon: FiCheckCircle,
      iconBg: 'bg-[#e6f7f5]',
      iconColor: 'text-[#00bfa5]',
      subtitle: <span className="text-gray-400 text-[11px] font-medium">All time completed</span>,
      onClick: () => navigate('/vendor/jobs'),
    },
  ];

  return (
    <div className="px-4 pt-4">
      <div className="grid grid-cols-2 gap-4 mb-4">
        {cards.map((card, index) => {
          const IconComponent = card.icon;

          return (
            <button
              key={card.title}
              type="button"
              onClick={card.onClick}
              className="bg-white rounded-[24px] p-4 text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all active:scale-[0.98] flex flex-col justify-between min-h-[135px]"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-[12px] ${card.iconBg}`}>
                  <IconComponent className={`w-4 h-4 ${card.iconColor}`} />
                </div>
                <p className="text-[13px] text-gray-800 font-bold tracking-tight">
                  {card.title}
                </p>
              </div>
              
              <div>
                <p className="text-[26px] font-black text-gray-900 mb-1 leading-tight tracking-tight">
                  {card.value}
                </p>
                {card.subtitle}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

StatsCards.displayName = 'VendorStatsCards';
export default StatsCards;
