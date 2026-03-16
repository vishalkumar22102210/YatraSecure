'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface TravelStatsProps {
  data: any;
}

const COLORS = ['#7C3AED', '#10B981', '#F97316', '#3B82F6', '#EC4899', '#f59e0b'];

export default function TravelStats({ data }: TravelStatsProps) {
  if (!data || !data.categoryBreakdown) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
      {/* Category Breakdown (Pie) */}
      <div style={{ 
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', 
        padding: 24, borderRadius: 24, height: 320 
      }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 20, textAlign: 'center' }}>Spending by Category</h4>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.categoryBreakdown}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="amount"
              nameKey="category"
            >
              {data.categoryBreakdown.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
              itemStyle={{ color: 'white' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart Analysis */}
      <div style={{ 
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', 
        padding: 24, borderRadius: 24, height: 320 
      }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 20, textAlign: 'center' }}>Expense Analysis</h4>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.categoryBreakdown}>
            <XAxis dataKey="category" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
            <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.02)' }}
              contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
            />
            <Bar dataKey="amount" fill="#7C3AED" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
